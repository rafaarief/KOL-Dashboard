export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** Public taxonomy lookup (categories, niches, platforms) — used by campaign creation forms
 * and marketplace filter dropdowns. No auth required; this is non-sensitive reference data. */
export async function GET() {
  const db = getDb();
  const [categories, niches, platforms] = await Promise.all([
    db.select().from(schema.marketplaceCategories).orderBy(asc(schema.marketplaceCategories.name)),
    db.select().from(schema.niches).orderBy(asc(schema.niches.name)),
    db.select().from(schema.platforms).orderBy(asc(schema.platforms.name)),
  ]);

  return NextResponse.json({ categories, niches, platforms });
}
