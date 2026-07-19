export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(ilike(schema.campaigns.title, `%${q}%`));
  if (status) conditions.push(eq(schema.campaigns.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.campaigns.id,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      status: schema.campaigns.status,
      budgetType: schema.campaigns.budgetType,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      publishedAt: schema.campaigns.publishedAt,
      brandName: schema.brandProfiles.brandName,
      categoryName: schema.marketplaceCategories.name,
      applicationCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(whereClause)
    .orderBy(desc(schema.campaigns.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.campaigns).where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

const ACTIONS = {
  approve: { status: "published", publishedAt: new Date() },
  reject: { status: "rejected" },
  pause: { status: "paused" },
  close: { status: "closed" },
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
    .update(schema.campaigns)
    .set({ ...ACTIONS[action], updatedAt: new Date() })
    .where(eq(schema.campaigns.id, id));

  return NextResponse.json({ success: true });
}
