// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, isNotNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const domisiliRows = await db
    .selectDistinct({ domisili: schema.nanoKols.domisili })
    .from(schema.nanoKols)
    .where(isNotNull(schema.nanoKols.domisili))
    .orderBy(asc(schema.nanoKols.domisili));

  const genderRows = await db
    .selectDistinct({ normalizedGender: schema.nanoKols.normalizedGender })
    .from(schema.nanoKols)
    .where(isNotNull(schema.nanoKols.normalizedGender))
    .orderBy(asc(schema.nanoKols.normalizedGender));

  const categoryRows = await db.execute(
    sql`select distinct jsonb_array_elements_text(categories) as category from nano_kols order by category`
  );

  return NextResponse.json({
    domisili: domisiliRows.map((row) => row.domisili).filter((value): value is string => Boolean(value)),
    genders: genderRows.map((row) => row.normalizedGender).filter((value): value is string => Boolean(value)),
    categories: (categoryRows as unknown as { category: string }[]).map((row) => row.category),
  });
}
