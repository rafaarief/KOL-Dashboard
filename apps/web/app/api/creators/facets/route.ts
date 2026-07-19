// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, isNotNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const nicheRows = await db
    .selectDistinct({ primaryNiche: schema.creators.primaryNiche })
    .from(schema.creators)
    .where(isNotNull(schema.creators.primaryNiche))
    .orderBy(asc(schema.creators.primaryNiche));

  return NextResponse.json({
    niches: nicheRows.map((row) => row.primaryNiche).filter((value): value is string => Boolean(value)),
  });
}
