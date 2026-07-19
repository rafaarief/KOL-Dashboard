/** Tiered single-video view score — PRD section 8.7.2. `views` null (view count unavailable) → 0. */
export function calculateViewScore(views: number | null): number {
  if (views === null || views < 0) return 0;
  if (views < 1_000) return 5;
  if (views < 5_000) return 15;
  if (views < 10_000) return 35;
  if (views < 25_000) return 60;
  if (views < 50_000) return 72;
  if (views < 100_000) return 82;
  if (views < 250_000) return 90;
  if (views < 1_000_000) return 96;
  return 100;
}

/**
 * Creator-level view performance: 70% the video that surfaced them in this search, 30% the
 * average score of their five most recent videos. This keeps one old viral hit from
 * dominating the ranking on its own — see PRD section 8.7.2.
 */
export function calculateViewPerformanceScore(params: {
  relevantVideoViews: number | null;
  recentVideoViews: Array<number | null>;
}): { relevantVideoScore: number; recentPerformanceScore: number; viewPerformanceScore: number } {
  const relevantVideoScore = calculateViewScore(params.relevantVideoViews);

  const recentScores = params.recentVideoViews.map(calculateViewScore);
  const recentPerformanceScore =
    recentScores.length > 0 ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length : 0;

  const viewPerformanceScore = relevantVideoScore * 0.7 + recentPerformanceScore * 0.3;

  return { relevantVideoScore, recentPerformanceScore, viewPerformanceScore };
}
