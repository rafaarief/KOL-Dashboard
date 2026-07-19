/** Tiered freshness scoring — PRD section 8.7.1. `daysSinceUpload` null means "unknown" → 0. */
export function calculateFreshnessScore(daysSinceUpload: number | null): number {
  if (daysSinceUpload === null || daysSinceUpload < 0) return 0;
  if (daysSinceUpload <= 3) return 100;
  if (daysSinceUpload <= 7) return 90;
  if (daysSinceUpload <= 14) return 80;
  if (daysSinceUpload <= 30) return 65;
  if (daysSinceUpload <= 60) return 45;
  if (daysSinceUpload <= 90) return 25;
  return 10;
}
