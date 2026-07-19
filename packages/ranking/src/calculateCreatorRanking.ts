import { calculateFreshnessScore } from "./freshness.js";
import { calculateViewPerformanceScore } from "./viewPerformance.js";
import { labelForScore } from "./label.js";
import type { RankingBreakdown, RankingInput } from "./types.js";

const WEIGHTS = {
  freshness: 0.45,
  viewPerformance: 0.45,
  keywordRelevance: 0.1,
} as const;

/**
 * Deterministic creator ranking — PRD section 8.7 / 18.11. This is the ONLY place the
 * final match percentage is computed; it must never be delegated to an LLM.
 */
export function calculateCreatorRanking(input: RankingInput): RankingBreakdown {
  const freshnessScore = calculateFreshnessScore(input.daysSinceRelevantVideoUpload);

  const { relevantVideoScore, recentPerformanceScore, viewPerformanceScore } = calculateViewPerformanceScore({
    relevantVideoViews: input.relevantVideoViews,
    recentVideoViews: input.recentVideoViews,
  });

  const keywordRelevanceScore = Math.min(100, Math.max(0, input.keywordRelevance));

  const finalScore =
    freshnessScore * WEIGHTS.freshness +
    viewPerformanceScore * WEIGHTS.viewPerformance +
    keywordRelevanceScore * WEIGHTS.keywordRelevance;

  return {
    freshnessScore,
    relevantVideoScore,
    recentPerformanceScore,
    viewPerformanceScore,
    keywordRelevanceScore,
    finalScore: Math.round(finalScore * 10) / 10,
    label: labelForScore(finalScore),
  };
}
