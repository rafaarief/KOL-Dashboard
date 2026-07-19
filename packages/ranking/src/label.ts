import type { RankingLabel } from "./types.js";

/** PRD section 8.7.5. */
export function labelForScore(finalScore: number): RankingLabel {
  if (finalScore >= 90) return "Excellent Match";
  if (finalScore >= 80) return "Strong Match";
  if (finalScore >= 70) return "Good Match";
  if (finalScore >= 60) return "Possible Match";
  return "Low Priority";
}
