import { z } from "zod";

export const rankingLabelSchema = z.enum([
  "Excellent Match",
  "Strong Match",
  "Good Match",
  "Possible Match",
  "Low Priority",
]);

/** Deterministic ranking output — see PRD section 8.7 / 18.11. Never produced by an LLM. */
export const rankingBreakdownSchema = z.object({
  freshnessScore: z.number().min(0).max(100),
  relevantVideoScore: z.number().min(0).max(100),
  recentPerformanceScore: z.number().min(0).max(100),
  viewPerformanceScore: z.number().min(0).max(100),
  keywordRelevanceScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  label: rankingLabelSchema,
});
export type RankingBreakdown = z.infer<typeof rankingBreakdownSchema>;
