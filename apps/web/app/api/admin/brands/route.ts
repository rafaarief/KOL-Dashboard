export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const verification = url.searchParams.get("verification");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(or(ilike(schema.brandProfiles.brandName, `%${q}%`), ilike(schema.brandProfiles.industry, `%${q}%`)));
  if (verification) conditions.push(eq(schema.brandProfiles.verificationStatus, verification));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.brandProfiles.id,
      slug: schema.brandProfiles.slug,
      brandName: schema.brandProfiles.brandName,
      industry: schema.brandProfiles.industry,
      city: schema.brandProfiles.city,
      email: schema.users.email,
      verificationStatus: schema.brandProfiles.verificationStatus,
      status: schema.brandProfiles.status,
      featured: schema.brandProfiles.featured,
      createdAt: schema.brandProfiles.createdAt,
      activeCampaigns: sql<number>`(select count(*) from campaigns c where c.brand_profile_id = brand_profiles.id and c.status = 'published')`,
    })
    .from(schema.brandProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
    .where(whereClause)
    .orderBy(desc(schema.brandProfiles.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brandProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
    .where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

const ACTIONS = {
  verify: { verificationStatus: "verified" },
  reject_verification: { verificationStatus: "rejected" },
  suspend: { status: "suspended" },
  reactivate: { status: "active" },
  feature: { featured: true },
  unfeature: { featured: false },
} as const;

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const action = body?.action as keyof typeof ACTIONS | undefined;
  if (!id || !action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(schema.brandProfiles)
    .set({ ...ACTIONS[action], updatedAt: new Date() })
    .where(eq(schema.brandProfiles.id, id));

  return NextResponse.json({ success: true });
}
