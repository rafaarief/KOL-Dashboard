/** Weighted keyword-relevance inputs, each pre-scored 0-100 by the caller — PRD section 8.7.3. */
export interface KeywordRelevanceInputs {
  captionMatchScore: number;
  hashtagMatchScore: number;
  nicheMatchScore: number;
  locationMatchScore: number;
}

export function calculateKeywordRelevanceScore(inputs: KeywordRelevanceInputs): number {
  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  return (
    clamp(inputs.captionMatchScore) * 0.4 +
    clamp(inputs.hashtagMatchScore) * 0.25 +
    clamp(inputs.nicheMatchScore) * 0.2 +
    clamp(inputs.locationMatchScore) * 0.15
  );
}
