import type { RankingBreakdown } from "./types.js";

export interface ExplanationContext {
  daysSinceRelevantVideoUpload: number | null;
  relevantVideoViews: number | null;
  recentVideosOver10k: number;
  recentVideoCount: number;
  location: string | null;
}

/** Deterministic, human-readable ranking explanation — PRD section 8.7 / 8.8. */
export function explainRanking(breakdown: RankingBreakdown, context: ExplanationContext): string {
  const parts: string[] = [];

  if (context.daysSinceRelevantVideoUpload !== null) {
    parts.push(
      context.daysSinceRelevantVideoUpload <= 1
        ? "uploaded relevant content today or yesterday"
        : `uploaded relevant content ${context.daysSinceRelevantVideoUpload} days ago`
    );
  }

  if (context.relevantVideoViews !== null) {
    parts.push(`the discovered video has ${context.relevantVideoViews.toLocaleString("en-US")} views`);
  }

  if (context.recentVideoCount > 0) {
    parts.push(
      `${context.recentVideosOver10k} of the creator's ${context.recentVideoCount} recent videos exceeded 10,000 views`
    );
  }

  if (context.location) {
    parts.push(`content is tied to ${context.location}`);
  }

  const clause = parts.length > 0 ? parts.join(", ") : "limited signal was available for this creator";

  return `Ranked as ${breakdown.label} (${breakdown.finalScore}%) because ${clause}.`;
}
