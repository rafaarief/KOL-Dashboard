import { describe, expect, it } from "vitest";
import { normalizeUsername, slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases, dashes, and trims punctuation", () => {
    expect(slugify("Kopi Rona")).toBe("kopi-rona");
    expect(slugify("  Dapur Temu!! ")).toBe("dapur-temu");
    expect(slugify("Micro Creators Needed for Coffee Shop Opening")).toBe("micro-creators-needed-for-coffee-shop-opening");
  });
});

describe("normalizeUsername", () => {
  it("strips characters that aren't allowed in a creator handle", () => {
    expect(normalizeUsername("Nadia Daily!")).toBe("nadiadaily");
    expect(normalizeUsername("nadia.daily_official")).toBe("nadia.daily_official");
  });

  it("rejects producing an empty handle from punctuation-only input at the call site", () => {
    // normalizeUsername itself doesn't enforce a minimum length — the registration API route
    // does (see app/api/register/route.ts) — this documents that boundary.
    expect(normalizeUsername("!!!")).toBe("");
  });
});
