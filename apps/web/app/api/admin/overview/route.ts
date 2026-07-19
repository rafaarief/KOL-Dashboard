export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();

  const [{ count: totalCreators }] = await db.select({ count: sql<number>`count(*)` }).from(schema.creatorProfiles);
  const [{ count: activeCreators }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.creatorProfiles)
    .where(sql`status = 'active'`);
  const [{ count: totalBrands }] = await db.select({ count: sql<number>`count(*)` }).from(schema.brandProfiles);
  const [{ count: verifiedBrands }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandProfiles)
    .where(sql`verification_status = 'verified'`);
  const [{ count: activeCampaigns }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaigns)
    .where(sql`status = 'published'`);
  const [{ count: applicationsThisMonth }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaignApplications)
    .where(sql`created_at >= date_trunc('month', now())`);
  const [{ count: pendingVerifications }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.verificationRequests)
    .where(sql`status = 'pending'`);
  const [{ count: reportedContent }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.reports)
    .where(sql`status = 'open'`);

  const campaignsByCategory = await db.execute(
    sql`select coalesce(mc.name, 'Uncategorized') as label, count(*)::int as count
        from campaigns c left join marketplace_categories mc on mc.id = c.category_id
        group by label order by count desc limit 12`
  );

  const creatorsByNiche = await db.execute(
    sql`select coalesce(n.name, 'Unclassified') as label, count(*)::int as count
        from creator_profiles cp left join niches n on n.id = cp.primary_niche_id
        group by label order by count desc limit 12`
  );

  const creatorsByCity = await db.execute(
    sql`select coalesce(city, 'Unknown') as label, count(*)::int as count
        from creator_profiles group by label order by count desc limit 10`
  );

  return NextResponse.json({
    totals: {
      totalCreators: Number(totalCreators),
      activeCreators: Number(activeCreators),
      totalBrands: Number(totalBrands),
      verifiedBrands: Number(verifiedBrands),
      activeCampaigns: Number(activeCampaigns),
      applicationsThisMonth: Number(applicationsThisMonth),
      pendingVerifications: Number(pendingVerifications),
      reportedContent: Number(reportedContent),
    },
    campaignsByCategory,
    creatorsByNiche,
    creatorsByCity,
  });
}
