import { describe, expect, it } from "vitest";
import searchFixture from "../fixtures/tiktok/search-results.json" with { type: "json" };
import { parseSearchResultsFromRehydration } from "../../src/extractors/tiktok/searchParser.js";

describe("parseSearchResultsFromRehydration", () => {
  it("extracts videos from a sanitized rehydration fixture", () => {
    const now = new Date("2026-07-17T00:00:00Z");
    const videos = parseSearchResultsFromRehydration(searchFixture, "photobooth blok m", now);

    expect(videos).toHaveLength(2);

    const top = videos.find((video) => video.creatorUsername === "jalanjalanblokm");
    expect(top).toBeDefined();
    expect(top?.viewCount).toBe(184_000);
    expect(top?.likeCount).toBe(15_200);
    expect(top?.hashtags).toContain("photoboothblokm");
    expect(top?.videoUrl).toBe("https://www.tiktok.com/@jalanjalanblokm/video/7123456789012345678");
    expect(top?.searchKeyword).toBe("photobooth blok m");
    expect(top?.extractionStatus).toBe("success");
  });

  it("returns an empty array when the payload has no video-shaped objects", () => {
    const videos = parseSearchResultsFromRehydration({ foo: "bar" }, "photobooth blok m", new Date());
    expect(videos).toEqual([]);
  });
});
