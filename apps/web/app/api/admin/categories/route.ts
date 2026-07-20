export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { slugify } from "@/lib/slugify";
import { recordAudit } from "@/lib/auditLog";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [categories, niches, platforms, collaborationTypes] = await Promise.all([
    db
      .select({
        id: schema.marketplaceCategories.id,
        name: schema.marketplaceCategories.name,
        slug: schema.marketplaceCategories.slug,
        createdAt: schema.marketplaceCategories.createdAt,
        campaignCount: sql<number>`(select count(*) from campaigns c where c.category_id = marketplace_categories.id)`,
      })
      .from(schema.marketplaceCategories)
      .orderBy(asc(schema.marketplaceCategories.name)),
    db
      .select({
        id: schema.niches.id,
        name: schema.niches.name,
        slug: schema.niches.slug,
        createdAt: schema.niches.createdAt,
        creatorCount: sql<number>`(
          select count(distinct cp.id) from creator_profiles cp
          left join creator_niches cn on cn.creator_profile_id = cp.id
          where cp.primary_niche_id = niches.id or cn.niche_id = niches.id
        )`,
        campaignCount: sql<number>`(select count(*) from campaign_niches cn2 where cn2.niche_id = niches.id)`,
      })
      .from(schema.niches)
      .orderBy(asc(schema.niches.name)),
    db
      .select({
        id: schema.platforms.id,
        name: schema.platforms.name,
        slug: schema.platforms.slug,
        creatorCount: sql<number>`(select count(*) from creator_social_accounts csa where csa.platform_id = platforms.id)`,
      })
      .from(schema.platforms)
      .orderBy(asc(schema.platforms.name)),
    db.select().from(schema.collaborationTypes).orderBy(asc(schema.collaborationTypes.name)),
  ]);

  return NextResponse.json({ categories, niches, platforms, collaborationTypes });
}

const TABLES = {
  category: schema.marketplaceCategories,
  niche: schema.niches,
  platform: schema.platforms,
  collaborationType: schema.collaborationTypes,
} as const;

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const type = body?.type as keyof typeof TABLES | undefined;
  const name = (body?.name as string | undefined)?.trim();
  if (!type || !name || !(type in TABLES)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const db = getDb();
  const table = TABLES[type];
  await db.insert(table).values({ name, slug: slugify(name) }).onConflictDoNothing();

  await recordAudit({ actorUserId: session.user.id, action: "taxonomy.create", entityType: type, metadata: { name }, request });

  return NextResponse.json({ success: true });
}
