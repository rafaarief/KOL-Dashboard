export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [categories, niches, platforms, collaborationTypes] = await Promise.all([
    db.select().from(schema.marketplaceCategories).orderBy(asc(schema.marketplaceCategories.name)),
    db.select().from(schema.niches).orderBy(asc(schema.niches.name)),
    db.select().from(schema.platforms).orderBy(asc(schema.platforms.name)),
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

  return NextResponse.json({ success: true });
}
