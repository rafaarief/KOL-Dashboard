export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

const WEEKLY_SERIES_SQL = (column: "creator_profiles" | "brand_profiles" | "campaigns" | "campaign_applications") => {
  // Table name is one of a fixed literal set above, never user input — safe to embed directly.
  switch (column) {
    case "creator_profiles":
      return sql`select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as label, count(*)::int as count
                  from creator_profiles where created_at >= now() - interval '12 weeks' group by label order by label asc`;
    case "brand_profiles":
      return sql`select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as label, count(*)::int as count
                  from brand_profiles where created_at >= now() - interval '12 weeks' group by label order by label asc`;
    case "campaigns":
      return sql`select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as label, count(*)::int as count
                  from campaigns where created_at >= now() - interval '12 weeks' group by label order by label asc`;
    case "campaign_applications":
      return sql`select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as label, count(*)::int as count
                  from campaign_applications where created_at >= now() - interval '12 weeks' group by label order by label asc`;
  }
};

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [creatorRegistrations, brandRegistrations, campaignsCreated, applicationsOverTime, platformDistribution] = await Promise.all([
    db.execute(WEEKLY_SERIES_SQL("creator_profiles")),
    db.execute(WEEKLY_SERIES_SQL("brand_profiles")),
    db.execute(WEEKLY_SERIES_SQL("campaigns")),
    db.execute(WEEKLY_SERIES_SQL("campaign_applications")),
    db.execute(
      sql`select p.name as label, count(*)::int as count
          from creator_social_accounts csa join platforms p on p.id = csa.platform_id
          group by label order by count desc`
    ),
  ]);

  return NextResponse.json({
    creatorRegistrations,
    brandRegistrations,
    campaignsCreated,
    applicationsOverTime,
    platformDistribution,
  });
}
