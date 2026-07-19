import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const SORT_COLUMNS = {
  best_match: desc(schema.searchResults.finalScore),
  most_recent: desc(schema.videos.publishedAt),
  highest_views: desc(schema.videos.viewCount),
  highest_followers: desc(schema.creators.followerCount),
  lowest_followers: asc(schema.creators.followerCount),
} as const;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const minimumScore = url.searchParams.get("minimumScore");
  const minimumFollowers = url.searchParams.get("minimumFollowers");
  const maximumFollowers = url.searchParams.get("maximumFollowers");
  const niche = url.searchParams.get("niche");
  const location = url.searchParams.get("location");
  const sort = (url.searchParams.get("sort") ?? "best_match") as keyof typeof SORT_COLUMNS;
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();

  const conditions = [eq(schema.searchResults.searchId, params.id)];
  if (minimumScore) conditions.push(gte(schema.searchResults.finalScore, minimumScore));
  if (minimumFollowers) conditions.push(gte(schema.creators.followerCount, Number.parseInt(minimumFollowers, 10)));
  if (maximumFollowers) conditions.push(lte(schema.creators.followerCount, Number.parseInt(maximumFollowers, 10)));
  if (niche) conditions.push(eq(schema.creators.primaryNiche, niche));
  if (location) conditions.push(eq(schema.creators.inferredLocation, location));

  const rows = await db
    .select({
      result: schema.searchResults,
      creator: schema.creators,
      video: schema.videos,
    })
    .from(schema.searchResults)
    .innerJoin(schema.creators, eq(schema.searchResults.creatorId, schema.creators.id))
    .leftJoin(schema.videos, eq(schema.searchResults.primaryVideoId, schema.videos.id))
    .where(and(...conditions))
    .orderBy(SORT_COLUMNS[sort] ?? SORT_COLUMNS.best_match)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.searchResults)
    .innerJoin(schema.creators, eq(schema.searchResults.creatorId, schema.creators.id))
    .where(and(...conditions));

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}
