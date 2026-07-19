/** Confidence tiers per section 23 — ranking must ignore values below this floor rather than treating them as zero. */
export const RELIABLE_CONFIDENCE_FLOOR = 0.4;

export function isReliable(confidence: number): boolean {
  return confidence >= RELIABLE_CONFIDENCE_FLOOR;
}
