export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

const VALID_STATUSES = ["viewed", "shortlisted", "accepted", "rejected"] as const;

/** Mirrors the brand-side transition rules (app/api/brand/campaigns/[id]/applicants/route.ts)
 * exactly, so admin overrides can never disagree with what a brand is allowed to do — the only
 * difference is no ownership check (an admin can act on any campaign) and an audit-log entry. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  const status = body?.status as (typeof VALID_STATUSES)[number] | undefined;
  if (!applicationId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const db = getDb();
  const [before] = await db
    .select({ status: schema.campaignApplications.status })
    .from(schema.campaignApplications)
    .where(and(eq(schema.campaignApplications.id, applicationId), eq(schema.campaignApplications.campaignId, params.id)))
    .limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [updated] = await db
    .update(schema.campaignApplications)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(schema.campaignApplications.id, applicationId),
        eq(schema.campaignApplications.campaignId, params.id),
        ne(schema.campaignApplications.status, "withdrawn")
      )
    )
    .returning({ id: schema.campaignApplications.id });

  if (!updated) {
    return NextResponse.json({ error: "INVALID_TRANSITION" }, { status: 409 });
  }

  await db
    .update(schema.campaigns)
    .set({
      creatorCountAccepted: sql`(select count(*) from campaign_applications where campaign_id = ${params.id} and status = 'accepted')`,
    })
    .where(eq(schema.campaigns.id, params.id));

  await recordAudit({
    actorUserId: session.user.id,
    action: "application.status_change",
    entityType: "application",
    entityId: applicationId,
    before,
    after: { status },
    metadata: { campaignId: params.id },
    request,
  });

  return NextResponse.json({ success: true });
}
