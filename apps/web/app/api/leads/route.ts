// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, ilike, isNotNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const SORT_COLUMNS = {
  newest: desc(schema.businesses.createdAt),
  oldest: asc(schema.businesses.createdAt),
  highest_rating: desc(schema.businesses.rating),
  highest_lead_score: desc(schema.businesses.leadScore),
  name_asc: asc(schema.businesses.businessName),
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const categoryId = url.searchParams.get("categoryId");
  const province = url.searchParams.get("province");
  const city = url.searchParams.get("city");
  const district = url.searchParams.get("district");
  const crmStatus = url.searchParams.get("crmStatus");
  const minRating = url.searchParams.get("minRating");
  const hasWebsite = url.searchParams.get("hasWebsite");
  const hasWhatsapp = url.searchParams.get("hasWhatsapp");
  const hasInstagram = url.searchParams.get("hasInstagram");
  const sort = (url.searchParams.get("sort") ?? "newest") as keyof typeof SORT_COLUMNS;
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(schema.businesses.businessName, `%${q}%`),
        ilike(schema.businesses.phone, `%${q}%`),
        ilike(schema.businesses.website, `%${q}%`),
        ilike(schema.businesses.instagram, `%${q}%`),
        ilike(schema.businesses.address, `%${q}%`)
      )
    );
  }
  if (categoryId) conditions.push(eq(schema.businesses.categoryId, categoryId));
  if (province) conditions.push(ilike(schema.businesses.province, province));
  if (city) conditions.push(ilike(schema.businesses.city, city));
  if (district) conditions.push(ilike(schema.businesses.district, district));
  if (crmStatus) conditions.push(eq(schema.businesses.crmStatus, crmStatus));
  if (minRating) conditions.push(gte(schema.businesses.rating, minRating));
  if (hasWebsite === "true") conditions.push(isNotNull(schema.businesses.website));
  if (hasWhatsapp === "true") conditions.push(eq(schema.businesses.isWhatsappCandidate, true));
  if (hasInstagram === "true") conditions.push(isNotNull(schema.businesses.instagram));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({ business: schema.businesses, category: schema.categories })
      .from(schema.businesses)
      .leftJoin(schema.categories, eq(schema.businesses.categoryId, schema.categories.id))
      .where(whereClause)
      .orderBy(SORT_COLUMNS[sort] ?? SORT_COLUMNS.newest)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(schema.businesses).where(whereClause),
  ]);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}
