// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, ilike, isNotNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const SORT_COLUMNS = {
  newest: desc(schema.nanoKols.createdAt),
  name_asc: asc(schema.nanoKols.fullName),
  highest_tiktok_followers: desc(schema.nanoKols.tiktokFollowersCount),
  highest_instagram_followers: desc(schema.nanoKols.instagramFollowersCount),
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const domisili = url.searchParams.get("domisili");
  const gender = url.searchParams.get("gender");
  const minTiktokFollowers = url.searchParams.get("minTiktokFollowers");
  const hasInstagram = url.searchParams.get("hasInstagram");
  const sort = (url.searchParams.get("sort") ?? "newest") as keyof typeof SORT_COLUMNS;
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(schema.nanoKols.fullName, `%${q}%`),
        ilike(schema.nanoKols.tiktokUsername, `%${q}%`),
        ilike(schema.nanoKols.instagramUsername, `%${q}%`),
        ilike(schema.nanoKols.domisili, `%${q}%`)
      )
    );
  }
  if (category) conditions.push(sql`${schema.nanoKols.categories} @> ${JSON.stringify([category])}::jsonb`);
  if (domisili) conditions.push(eq(schema.nanoKols.domisili, domisili));
  if (gender) conditions.push(eq(schema.nanoKols.normalizedGender, gender));
  if (minTiktokFollowers) conditions.push(gte(schema.nanoKols.tiktokFollowersCount, Number.parseInt(minTiktokFollowers, 10)));
  if (hasInstagram === "true") conditions.push(isNotNull(schema.nanoKols.instagramUsername));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(schema.nanoKols)
      .where(whereClause)
      .orderBy(SORT_COLUMNS[sort] ?? SORT_COLUMNS.newest)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(schema.nanoKols).where(whereClause),
  ]);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}
