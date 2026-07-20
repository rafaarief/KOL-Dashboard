export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
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
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(ilike(schema.campaigns.title, `%${q}%`));
  if (status) conditions.push(eq(schema.campaigns.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.campaigns.id,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      status: schema.campaigns.status,
      budgetType: schema.campaigns.budgetType,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      publishedAt: schema.campaigns.publishedAt,
      brandName: schema.brandProfiles.brandName,
      categoryName: schema.marketplaceCategories.name,
      applicationCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(whereClause)
    .orderBy(desc(schema.campaigns.createdAt))
    .limit(pageSize)
    .offset(isCsv ? 0 : (page - 1) * pageSize);

  if (isCsv) return csvResponse(rows, "campaigns.csv");

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.campaigns).where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

// State-restricted transitions mirror the brand-side state machine (app/api/brand/campaigns/[id]/route.ts)
// so admin and brand actions can never disagree on what's a valid move. "reject" only applies to
// drafts still awaiting approval, not published campaigns — use pause/close for those.
const TRANSITIONS = {
  approve: { from: ["draft"], set: { status: "published", publishedAt: new Date() } },
  reject: { from: ["draft"], set: { status: "rejected" } },
  pause: { from: ["published"], set: { status: "paused" } },
  resume: { from: ["paused"], set: { status: "published" } },
  close: { from: ["published", "paused"], set: { status: "closed" } },
  // Explicit override: reopening a closed/rejected campaign is unusual enough that it always
  // gets its own audit-log action name (campaign.admin_reopen) rather than blending into "approve".
  admin_reopen: { from: ["closed", "rejected"], set: { status: "draft" } },
} as const;

const UNRESTRICTED_ACTIONS = {
  feature: { featured: true },
  unfeature: { featured: false },
} as const;

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const action = body?.action as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();

  if (action && action in UNRESTRICTED_ACTIONS) {
    const set = UNRESTRICTED_ACTIONS[action as keyof typeof UNRESTRICTED_ACTIONS];
    const [before] = await db.select({ featured: schema.campaigns.featured }).from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await db.update(schema.campaigns).set({ ...set, updatedAt: new Date() }).where(eq(schema.campaigns.id, id));
    await recordAudit({ actorUserId: session.user.id, action: `campaign.${action}`, entityType: "campaign", entityId: id, before, after: set, request });
    return NextResponse.json({ success: true });
  }

  if (action && action in TRANSITIONS) {
    const { from, set } = TRANSITIONS[action as keyof typeof TRANSITIONS];
    const [before] = await db.select({ status: schema.campaigns.status }).from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const [updated] = await db
      .update(schema.campaigns)
      .set({ ...set, updatedAt: new Date() })
      .where(and(eq(schema.campaigns.id, id), inArray(schema.campaigns.status, from as unknown as string[])))
      .returning({ id: schema.campaigns.id });

    if (!updated) {
      return NextResponse.json({ error: "INVALID_TRANSITION", message: `Campaign is "${before.status}" — "${action}" isn't valid from there.` }, { status: 409 });
    }

    await recordAudit({
      actorUserId: session.user.id,
      action: `campaign.${action}`,
      entityType: "campaign",
      entityId: id,
      before,
      after: set,
      metadata: action === "admin_reopen" ? { override: true } : undefined,
      request,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
}
