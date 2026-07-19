import { eq } from "drizzle-orm";
import { getDb, schema } from "@kol-finder/database";

export async function isSearchCancelled(searchId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ status: schema.searches.status })
    .from(schema.searches)
    .where(eq(schema.searches.id, searchId))
    .limit(1);
  return row?.status === "cancelled";
}

export async function markSearchStatus(
  searchId: string,
  updates: Partial<{
    status: string;
    progressPercentage: number;
    progressStep: string;
    candidateVideoCount: number;
    qualifyingVideoCount: number;
    creatorCount: number;
    errorCount: number;
    startedAt: Date;
    completedAt: Date;
  }>
): Promise<void> {
  const db = getDb();
  await db.update(schema.searches).set(updates).where(eq(schema.searches.id, searchId));
}

export async function recordSearchKeyword(
  searchId: string,
  keyword: string,
  keywordType: "direct" | "semantic" | "discovery"
): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(schema.searchKeywords)
    .values({ searchId, keyword, keywordType })
    .returning({ id: schema.searchKeywords.id });
  return row.id;
}

export async function updateSearchKeywordResult(
  keywordId: string,
  resultCount: number,
  processingStatus: string
): Promise<void> {
  const db = getDb();
  await db
    .update(schema.searchKeywords)
    .set({ resultCount, processingStatus })
    .where(eq(schema.searchKeywords.id, keywordId));
}

export async function recordScrapingEvent(event: {
  searchId?: string | null;
  creatorId?: string | null;
  jobId: string;
  eventType: string;
  status: string;
  attempt?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(schema.scrapingEvents).values({
    searchId: event.searchId ?? null,
    creatorId: event.creatorId ?? null,
    jobId: event.jobId,
    eventType: event.eventType,
    status: event.status,
    attempt: event.attempt ?? 1,
    errorCode: event.errorCode ?? null,
    errorMessage: event.errorMessage ?? null,
    metadata: event.metadata ?? {},
  });
}
