import { describe, expect, it } from "vitest";
import { daysSince, normalizeTikTokDate } from "./normalizeDate.js";

const NOW = new Date("2026-07-17T12:00:00Z");

describe("normalizeTikTokDate", () => {
  it("parses relative durations", () => {
    const twoDaysAgo = normalizeTikTokDate("2d ago", NOW);
    expect(twoDaysAgo.publishedAt).toBe(new Date(NOW.getTime() - 2 * 86_400_000).toISOString());
    expect(twoDaysAgo.isEstimated).toBe(true);

    const threeHoursAgo = normalizeTikTokDate("3h ago", NOW);
    expect(threeHoursAgo.publishedAt).toBe(new Date(NOW.getTime() - 3 * 3_600_000).toISOString());
  });

  it("parses Indonesian relative durations", () => {
    const result = normalizeTikTokDate("5 hari yang lalu", NOW);
    expect(result.publishedAt).toBe(new Date(NOW.getTime() - 5 * 86_400_000).toISOString());
  });

  it("parses ISO-like absolute dates with high confidence", () => {
    const result = normalizeTikTokDate("2026-07-10", NOW);
    expect(result.isEstimated).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it("returns null for unparseable input", () => {
    const result = normalizeTikTokDate("gibberish", NOW);
    expect(result.publishedAt).toBeNull();
    expect(result.confidence).toBe(0);
  });
});

describe("daysSince", () => {
  it("computes whole days between a timestamp and now", () => {
    const publishedAt = new Date(NOW.getTime() - 5 * 86_400_000).toISOString();
    expect(daysSince(publishedAt, NOW)).toBe(5);
  });

  it("returns null when publishedAt is null", () => {
    expect(daysSince(null, NOW)).toBeNull();
  });
});
