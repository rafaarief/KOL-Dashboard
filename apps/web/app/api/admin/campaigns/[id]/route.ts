export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [campaign] = await db
    .select({
      id: schema.campaigns.id,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      status: schema.campaigns.status,
      shortDescription: schema.campaigns.shortDescription,
      fullDescription: schema.campaigns.fullDescription,
      budgetType: schema.campaigns.budgetType,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      featured: schema.campaigns.featured,
      coverImageUrl: schema.campaigns.coverImageUrl,
      brandProfileId: schema.campaigns.brandProfileId,
      brandName: schema.brandProfiles.brandName,
      brandSlug: schema.brandProfiles.slug,
      createdAt: schema.campaigns.createdAt,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .where(eq(schema.campaigns.id, params.id))
    .limit(1);

  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const applicants = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      proposedRate: schema.campaignApplications.proposedRate,
      createdAt: schema.campaignApplications.createdAt,
      creatorId: schema.creatorProfiles.id,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(eq(schema.campaignApplications.campaignId, campaign.id));

  return NextResponse.json({ campaign, applicants });
}

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  shortDescription: z.string().max(300).optional(),
  fullDescription: z.string().max(5000).optional(),
  creatorCountNeeded: z.number().int().min(1).max(1000).optional(),
  coverImageUrl: z.string().url().or(z.literal("")).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });

  const db = getDb();
  const [before] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, params.id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db.update(schema.campaigns).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.campaigns.id, params.id));

  await recordAudit({
    actorUserId: session.user.id,
    action: "campaign.edit",
    entityType: "campaign",
    entityId: params.id,
    before: Object.fromEntries(Object.keys(parsed.data).map((k) => [k, (before as Record<string, unknown>)[k]])),
    after: parsed.data,
    request,
  });

  return NextResponse.json({ success: true });
}
