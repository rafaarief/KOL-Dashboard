// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const categories = await db.select().from(schema.categories).orderBy(asc(schema.categories.categoryName));

  return NextResponse.json({ categories });
}
