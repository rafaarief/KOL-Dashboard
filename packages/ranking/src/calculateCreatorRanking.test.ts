import { describe, expect, it } from "vitest";
import { calculateCreatorRanking } from "./calculateCreatorRanking.js";
import { calculateFreshnessScore } from "./freshness.js";
import { calculateViewScore } from "./viewPerformance.js";
import { labelForScore } from "./label.js";

describe("calculateFreshnessScore", () => {
  it("scores per the tiered model", () => {
    expect(calculateFreshnessScore(0)).toBe(100);
    expect(calculateFreshnessScore(3)).toBe(100);
    expect(calculateFreshnessScore(4)).toBe(90);
    expect(calculateFreshnessScore(14)).toBe(80);
    expect(calculateFreshnessScore(30)).toBe(65);
    expect(calculateFreshnessScore(60)).toBe(45);
    expect(calculateFreshnessScore(90)).toBe(25);
    expect(calculateFreshnessScore(91)).toBe(10);
    expect(calculateFreshnessScore(null)).toBe(0);
  });
});

describe("calculateViewScore", () => {
  it("scores per the tiered model", () => {
    expect(calculateViewScore(500)).toBe(5);
    expect(calculateViewScore(9_999)).toBe(35);
    expect(calculateViewScore(10_000)).toBe(60);
    expect(calculateViewScore(1_000_000)).toBe(100);
    expect(calculateViewScore(null)).toBe(0);
  });
});

describe("calculateCreatorRanking", () => {
  it("matches the worked example in PRD section 8.7.4 (Freshness 90 / View 82 / Keyword 85 -> 85.9%)", () => {
    // Freshness 90 => 4-7 days since upload.
    // View performance 82 requires relevantVideoScore=82 (50k-99,999 views), recent avg also 82.
    const breakdown = calculateCreatorRanking({
      relevantVideoViews: 80_000,
      daysSinceRelevantVideoUpload: 5,
      recentVideoViews: [80_000, 80_000, 80_000, 80_000, 80_000],
      keywordRelevance: 85,
    });

    expect(breakdown.freshnessScore).toBe(90);
    expect(breakdown.viewPerformanceScore).toBeCloseTo(82, 5);
    expect(breakdown.finalScore).toBeGreaterThanOrEqual(85);
    expect(breakdown.finalScore).toBeLessThanOrEqual(95);
    expect(breakdown.label).toBe("Strong Match");
  });

  it("treats unknown views/dates as low rather than zero-excluding", () => {
    const breakdown = calculateCreatorRanking({
      relevantVideoViews: null,
      daysSinceRelevantVideoUpload: null,
      recentVideoViews: [null, null, null, null, null],
      keywordRelevance: 0,
    });

    expect(breakdown.finalScore).toBe(0);
    expect(breakdown.label).toBe("Low Priority");
  });
});

describe("labelForScore", () => {
  it("maps score ranges to labels per section 8.7.5", () => {
    expect(labelForScore(95)).toBe("Excellent Match");
    expect(labelForScore(85)).toBe("Strong Match");
    expect(labelForScore(75)).toBe("Good Match");
    expect(labelForScore(65)).toBe("Possible Match");
    expect(labelForScore(50)).toBe("Low Priority");
  });
});
