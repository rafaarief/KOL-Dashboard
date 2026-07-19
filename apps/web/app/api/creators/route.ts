// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const SORT_COLUMNS = {
  newest: desc(schema.creators.firstDiscoveredAt),
  most_followers: desc(schema.creators.followerCount),
  most_likes: desc(schema.creators.totalLikeCount),
  name_asc: asc(schema.creators.username),
} as const;

/** Lists everything this KOL Finder has ever scraped into `creators` — every past
 * keyword search's output accumulates here, independent of which search found it. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const niche = url.searchParams.get("niche");
  const minFollowers = url.searchParams.get("minFollowers");
  const verifiedOnly = url.searchParams.get("verifiedOnly");
  const sort = (url.searchParams.get("sort") ?? "newest") as keyof typeof SORT_COLUMNS;
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(schema.creators.username, `%${q}%`),
        ilike(schema.creators.displayName, `%${q}%`),
        ilike(schema.creators.bio, `%${q}%`)
      )
    );
  }
  if (niche) conditions.push(eq(schema.creators.primaryNiche, niche));
  if (minFollowers) conditions.push(gte(schema.creators.followerCount, Number.parseInt(minFollowers, 10)));
  if (verifiedOnly === "true") conditions.push(eq(schema.creators.isVerified, true));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(schema.creators)
    .where(whereClause)
    .orderBy(SORT_COLUMNS[sort] ?? SORT_COLUMNS.newest)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.creators)
    .where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}
