export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [brandProfile] = await db.select({ id: schema.brandProfiles.id }).from(schema.brandProfiles).where(eq(schema.brandProfiles.userId, session.user.id)).limit(1);
  if (!brandProfile) return NextResponse.json({ results: [] });

  const rows = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      proposedRate: schema.campaignApplications.proposedRate,
      createdAt: schema.campaignApplications.createdAt,
      campaignId: schema.campaigns.id,
      campaignTitle: schema.campaigns.title,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(eq(schema.campaigns.brandProfileId, brandProfile.id))
    .orderBy(desc(schema.campaignApplications.createdAt));

  return NextResponse.json({ results: rows });
}
