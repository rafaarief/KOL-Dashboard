// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { csvResponse } from "@/lib/csv";

/** FR-018 — CSV export (PRD section 8.12 / 12). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();

  const rows = await db
    .select({ result: schema.searchResults, creator: schema.creators, video: schema.videos })
    .from(schema.searchResults)
    .innerJoin(schema.creators, eq(schema.searchResults.creatorId, schema.creators.id))
    .leftJoin(schema.videos, eq(schema.searchResults.primaryVideoId, schema.videos.id))
    .where(eq(schema.searchResults.searchId, params.id))
    .orderBy(schema.searchResults.rankPosition);

  // One batched lookup instead of one query per row — a search can return hundreds of rows.
  // Descending order + first-seen-wins below keeps each creator's most recent snapshot (the
  // original per-row query ordered ascending with no limit and took the *first* row, which was
  // actually the oldest snapshot ever recorded for that creator).
  const creatorIds = [...new Set(rows.map((row) => row.creator.id))];
  const snapshots =
    creatorIds.length > 0
      ? await db
          .select()
          .from(schema.creatorMetricSnapshots)
          .where(inArray(schema.creatorMetricSnapshots.creatorId, creatorIds))
          .orderBy(desc(schema.creatorMetricSnapshots.collectedAt))
      : [];
  const snapshotByCreator = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (!snapshotByCreator.has(snapshot.creatorId)) snapshotByCreator.set(snapshot.creatorId, snapshot);
  }

  const csvRows = rows.map((row) => {
    const snapshot = snapshotByCreator.get(row.creator.id);
    return {
      Rank: row.result.rankPosition,
      "Match Score": row.result.finalScore,
      Username: row.creator.username,
      "Display Name": row.creator.displayName,
      "Profile URL": row.creator.profileUrl,
      "Relevant Video URL": row.video?.videoUrl ?? "",
      "Relevant Video Caption": row.video?.caption ?? "",
      "Relevant Video Date": row.video?.publishedAt?.toString() ?? "",
      "Relevant Video Views": row.video?.viewCount ?? "",
      Followers: row.creator.followerCount,
      "Total Likes": row.creator.totalLikeCount,
      "Average Recent Views": snapshot?.recentAverageViews ?? "",
      "Median Recent Views": snapshot?.recentMedianViews ?? "",
      "Videos Above 10K Views": snapshot?.recentOver10kCount ?? "",
      "Primary Niche": row.creator.primaryNiche,
      "Secondary Niches": JSON.stringify(row.creator.secondaryNiches ?? []),
      Location: row.creator.inferredLocation,
      "Public Contact Text": row.creator.publicContactText,
      "Ranking Explanation": row.result.rankingExplanation,
      "Date Collected": row.result.createdAt.toISOString(),
    };
  });

  return csvResponse(csvRows, `kol-search-${params.id}.csv`);
}
