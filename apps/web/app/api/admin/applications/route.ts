export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";
import { csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId");
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (status) conditions.push(eq(schema.campaignApplications.status, status));
  if (campaignId) conditions.push(eq(schema.campaignApplications.campaignId, campaignId));
  if (q) {
    conditions.push(
      or(
        ilike(schema.creatorProfiles.displayName, `%${q}%`),
        ilike(schema.creatorProfiles.username, `%${q}%`),
        ilike(schema.campaigns.title, `%${q}%`),
        ilike(schema.brandProfiles.brandName, `%${q}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      proposedRate: schema.campaignApplications.proposedRate,
      adminNote: schema.campaignApplications.adminNote,
      createdAt: schema.campaignApplications.createdAt,
      updatedAt: schema.campaignApplications.updatedAt,
      campaignId: schema.campaigns.id,
      campaignTitle: schema.campaigns.title,
      campaignSlug: schema.campaigns.slug,
      brandName: schema.brandProfiles.brandName,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(whereClause)
    .orderBy(desc(schema.campaignApplications.createdAt))
    .limit(pageSize)
    .offset(isCsv ? 0 : (page - 1) * pageSize);

  if (isCsv) return csvResponse(rows, "applications.csv");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

const VALID_STATUSES = ["viewed", "shortlisted", "accepted", "rejected", "withdrawn"] as const;

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VALID_STATUSES).optional(),
  adminNote: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

/** Admin can change status on ANY application platform-wide (unlike the brand-scoped route,
 * which is restricted to the brand's own campaigns) — this is the "review on behalf of" and
 * "withdraw with reason" capability. Still respects the same withdrawn-is-terminal rule. */
export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  const { id, status, adminNote, reason } = parsed.data;
  if (!status && adminNote === undefined) return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });

  const db = getDb();
  const [before] = await db
    .select({ status: schema.campaignApplications.status, campaignId: schema.campaignApplications.campaignId })
    .from(schema.campaignApplications)
    .where(eq(schema.campaignApplications.id, id))
    .limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (status) {
    const [updated] = await db
      .update(schema.campaignApplications)
      .set({ status, adminNote: adminNote ?? undefined, updatedAt: new Date() })
      .where(and(eq(schema.campaignApplications.id, id), ne(schema.campaignApplications.status, "withdrawn")))
      .returning({ id: schema.campaignApplications.id });

    if (!updated) return NextResponse.json({ error: "INVALID_TRANSITION", message: "This application was withdrawn and can't be changed." }, { status: 409 });

    await db
      .update(schema.campaigns)
      .set({ creatorCountAccepted: sql`(select count(*) from campaign_applications where campaign_id = ${before.campaignId} and status = 'accepted')` })
      .where(eq(schema.campaigns.id, before.campaignId));
  } else {
    await db.update(schema.campaignApplications).set({ adminNote, updatedAt: new Date() }).where(eq(schema.campaignApplications.id, id));
  }

  await recordAudit({
    actorUserId: session.user.id,
    action: status ? "application.status_change" : "application.note",
    entityType: "application",
    entityId: id,
    before: { status: before.status },
    after: { status: status ?? before.status },
    metadata: reason ? { reason } : undefined,
    request,
  });

  return NextResponse.json({ success: true });
}
