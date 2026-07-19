// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const COLUMNS = [
  "Rank",
  "Match Score",
  "Username",
  "Display Name",
  "Profile URL",
  "Relevant Video URL",
  "Relevant Video Caption",
  "Relevant Video Date",
  "Relevant Video Views",
  "Followers",
  "Total Likes",
  "Average Recent Views",
  "Median Recent Views",
  "Videos Above 10K Views",
  "Primary Niche",
  "Secondary Niches",
  "Location",
  "Public Contact Text",
  "Ranking Explanation",
  "Date Collected",
] as const;

/** FR-018 — CSV export (PRD section 8.12 / 12). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();

  const rows = await db
    .select({ result: schema.searchResults, creator: schema.creators, video: schema.videos })
    .from(schema.searchResults)
    .innerJoin(schema.creators, eq(schema.searchResults.creatorId, schema.creators.id))
    .leftJoin(schema.videos, eq(schema.searchResults.primaryVideoId, schema.videos.id))
    .where(eq(schema.searchResults.searchId, params.id))
    .orderBy(schema.searchResults.rankPosition);

  const snapshotByCreator = new Map<string, typeof schema.creatorMetricSnapshots.$inferSelect>();
  for (const row of rows) {
    const [snapshot] = await db
      .select()
      .from(schema.creatorMetricSnapshots)
      .where(eq(schema.creatorMetricSnapshots.creatorId, row.creator.id))
      .orderBy(schema.creatorMetricSnapshots.collectedAt);
    if (snapshot) snapshotByCreator.set(row.creator.id, snapshot);
  }

  const lines = [COLUMNS.join(",")];

  for (const row of rows) {
    const snapshot = snapshotByCreator.get(row.creator.id);
    lines.push(
      [
        row.result.rankPosition,
        row.result.finalScore,
        row.creator.username,
        row.creator.displayName,
        row.creator.profileUrl,
        row.video?.videoUrl,
        row.video?.caption,
        row.video?.publishedAt?.toString(),
        row.video?.viewCount,
        row.creator.followerCount,
        row.creator.totalLikeCount,
        snapshot?.recentAverageViews,
        snapshot?.recentMedianViews,
        snapshot?.recentOver10kCount,
        row.creator.primaryNiche,
        JSON.stringify(row.creator.secondaryNiches ?? []),
        row.creator.inferredLocation,
        row.creator.publicContactText,
        row.result.rankingExplanation,
        row.result.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kol-search-${params.id}.csv"`,
    },
  });
}
