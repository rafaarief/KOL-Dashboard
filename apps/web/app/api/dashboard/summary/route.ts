// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** Categorized counts across everything this KOL Finder has accumulated — scraped creators
 * (search-by-keyword output), the curated nano KOL directory, and search activity. */
export async function GET() {
  const db = getDb();

  // All 7 queries are fully independent — batched into one Promise.all instead of 7 sequential
  // round trips on every dashboard load.
  const [
    [{ count: totalCreators }],
    [{ count: totalNanoKols }],
    [{ count: totalSearches }],
    creatorsByNiche,
    nanoKolsByCategory,
    searchesByStatus,
    recentSearches,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.creators),
    db.select({ count: sql<number>`count(*)` }).from(schema.nanoKols),
    db.select({ count: sql<number>`count(*)` }).from(schema.searches),
    db.execute(
      sql`select coalesce(primary_niche, 'Unclassified') as label, count(*)::int as count
        from creators group by label order by count desc limit 12`
    ),
    db.execute(
      sql`select coalesce(cat.category, 'Uncategorized') as label, count(*)::int as count
        from nano_kols
        left join lateral jsonb_array_elements_text(
          case when jsonb_array_length(categories) > 0 then categories else null end
        ) as cat(category) on true
        group by label order by count desc limit 12`
    ),
    db.execute(sql`select status as label, count(*)::int as count from searches group by status order by count desc`),
    db
      .select({
        id: schema.searches.id,
        originalQuery: schema.searches.originalQuery,
        status: schema.searches.status,
        creatorCount: schema.searches.creatorCount,
        createdAt: schema.searches.createdAt,
      })
      .from(schema.searches)
      .orderBy(desc(schema.searches.createdAt))
      .limit(5),
  ]);

  return NextResponse.json({
    totals: {
      creators: Number(totalCreators),
      nanoKols: Number(totalNanoKols),
      searches: Number(totalSearches),
    },
    creatorsByNiche: creatorsByNiche as unknown as { label: string; count: number }[],
    nanoKolsByCategory: nanoKolsByCategory as unknown as { label: string; count: number }[],
    searchesByStatus: searchesByStatus as unknown as { label: string; count: number }[],
    recentSearches,
  });
}
