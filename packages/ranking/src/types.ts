import type { rankingLabelSchema } from "@kol-finder/schemas";
import type { z } from "zod";

export type RankingLabel = z.infer<typeof rankingLabelSchema>;

export interface RankingInput {
  relevantVideoViews: number | null;
  daysSinceRelevantVideoUpload: number | null;
  recentVideoViews: Array<number | null>;
  /** Pre-aggregated 0-100 score — compute with calculateKeywordRelevanceScore() from the four weighted inputs. */
  keywordRelevance: number;
}

export interface RankingBreakdown {
  freshnessScore: number;
  relevantVideoScore: number;
  recentPerformanceScore: number;
  viewPerformanceScore: number;
  keywordRelevanceScore: number;
  finalScore: number;
  label: RankingLabel;
}
