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

  // Marketplace liquidity: of campaigns that have closed out their decision process (at
  // least one accepted or rejected applicant), what fraction of requested creator slots
  // actually got filled? A low number here means demand (campaigns) outpaces supply
  // (creators willing/accepted), or vice versa.
  const liquidityRows = await db.execute(
    sql`select
          coalesce(avg(case when creator_count_needed > 0 then least(1.0, creator_count_accepted::numeric / creator_count_needed) end), 0) as fill_rate,
          count(*) filter (where status = 'published')::int as open_campaigns,
          count(*) filter (where status = 'filled' or (status = 'published' and creator_count_accepted >= creator_count_needed))::int as filled_campaigns
        from campaigns`
  );
  const liquidity = (liquidityRows as unknown as { fill_rate: string; open_campaigns: number; filled_campaigns: number }[])[0];

  const conversionRows = await db.execute(
    sql`select
          count(*)::int as total,
          count(*) filter (where status = 'accepted')::int as accepted
        from campaign_applications`
  );
  const conversion = (conversionRows as unknown as { total: number; accepted: number }[])[0];

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
      campaignFillRate: Math.round(Number(liquidity?.fill_rate ?? 0) * 100),
      applicationConversionRate: conversion?.total ? Math.round((conversion.accepted / conversion.total) * 100) : 0,
    },
    campaignsByCategory,
    creatorsByNiche,
    creatorsByCity,
  });
}
