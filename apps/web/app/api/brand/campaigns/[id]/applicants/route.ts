export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

async function verifyCampaignOwnership(userId: string, campaignId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.campaigns.id })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .where(and(eq(schema.campaigns.id, campaignId), eq(schema.brandProfiles.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const owns = await verifyCampaignOwnership(session.user.id, params.id);
  if (!owns) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const db = getDb();
  const rows = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      pitch: schema.campaignApplications.pitch,
      proposedRate: schema.campaignApplications.proposedRate,
      estimatedDeliveryDays: schema.campaignApplications.estimatedDeliveryDays,
      createdAt: schema.campaignApplications.createdAt,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
      creatorCity: schema.creatorProfiles.city,
      creatorAvatarUrl: schema.creatorProfiles.avatarUrl,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(eq(schema.campaignApplications.campaignId, params.id));

  return NextResponse.json({ results: rows });
}

const VALID_STATUSES = ["viewed", "shortlisted", "accepted", "rejected"] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const owns = await verifyCampaignOwnership(session.user.id, params.id);
  if (!owns) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  const status = body?.status as (typeof VALID_STATUSES)[number] | undefined;
  if (!applicationId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const db = getDb();
  // A withdrawn application is off-limits to brand actions — the creator pulled out, so it
  // shouldn't be shortlistable/acceptable/rejectable back into an active state. Accepting is
  // additionally capped at the campaign's quota (checked in the same WHERE, not a separate
  // pre-check) — without this a brand could accept more creators than creatorCountNeeded while
  // the public campaign page's slotsRemaining independently clamps to 0, leaving the two views
  // disagreeing about how many slots are actually open.
  const [updated] = await db
    .update(schema.campaignApplications)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.campaignApplications.id, applicationId),
        eq(schema.campaignApplications.campaignId, params.id),
        ne(schema.campaignApplications.status, "withdrawn"),
        status === "accepted"
          ? sql`(select count(*) from campaign_applications ca2 where ca2.campaign_id = ${params.id} and ca2.status = 'accepted')
                < (select creator_count_needed from campaigns where id = ${params.id})`
          : sql`true`
      )
    )
    .returning({ id: schema.campaignApplications.id });

  if (!updated) {
    return NextResponse.json({ error: status === "accepted" ? "QUOTA_FULL" : "INVALID_TRANSITION" }, { status: 409 });
  }

  // Recompute from the source of truth rather than incrementing, so re-triggering this
  // action (or un-accepting elsewhere) can never double-count.
  await db
    .update(schema.campaigns)
    .set({
      creatorCountAccepted: sql`(select count(*) from campaign_applications where campaign_id = ${params.id} and status = 'accepted')`,
    })
    .where(eq(schema.campaigns.id, params.id));

  return NextResponse.json({ success: true });
}
