import { describe, expect, it } from "vitest";
import { normalizeTikTokNumber } from "./normalizeNumber.js";

describe("normalizeTikTokNumber", () => {
  it.each([
    ["999", 999],
    ["1.2K", 1200],
    ["12K", 12000],
    ["1.3M", 1_300_000],
    ["2,4 jt", 2_400_000],
    ["10 ribu", 10_000],
    ["1,3M", 1_300_000],
  ])("parses %s -> %i", (raw, expected) => {
    const result = normalizeTikTokNumber(raw);
    expect(result.normalized).toBe(expected);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns null with zero confidence for unparseable input", () => {
    const result = normalizeTikTokNumber("not a number");
    expect(result.normalized).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("returns null with zero confidence for empty input", () => {
    expect(normalizeTikTokNumber(null).normalized).toBeNull();
    expect(normalizeTikTokNumber("").normalized).toBeNull();
  });
});
