// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { searchQueryRequestSchema } from "@kol-finder/schemas";
import { interpretQuery } from "@kol-finder/ai";
import { getDb, schema } from "@/lib/db";
import { getDefaultUserId } from "@/lib/currentUser";
import { getTikTokSearchQueue } from "@/lib/queue";

/** FR-002/FR-003/FR-005 — accept a natural-language query, parse it, create the search job. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = searchQueryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const userId = await getDefaultUserId();
  const parsedQuery = await interpretQuery(parsed.data.query);
  if (parsed.data.maximumCreators) {
    parsedQuery.maximumCreators = parsed.data.maximumCreators;
  }

  const db = getDb();
  const [search] = await db
    .insert(schema.searches)
    .values({
      createdBy: userId,
      originalQuery: parsed.data.query,
      parsedQuery,
      status: "queued",
    })
    .returning({ id: schema.searches.id });

  await getTikTokSearchQueue().add(
    "TIKTOK_CREATOR_SEARCH",
    { jobType: "TIKTOK_CREATOR_SEARCH", searchId: search.id, requestedBy: userId },
    { attempts: 1, removeOnComplete: 500, removeOnFail: 500 }
  );

  return NextResponse.json({ searchId: search.id, status: "queued" }, { status: 201 });
}

/** FR — search history listing (PRD section 8.13). */
export async function GET() {
  const db = getDb();
  const searches = await db.select().from(schema.searches).orderBy(desc(schema.searches.createdAt)).limit(50);

  return NextResponse.json({ searches });
}
