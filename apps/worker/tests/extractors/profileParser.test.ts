import { describe, expect, it } from "vitest";
import profileFixture from "../fixtures/tiktok/profile.json" with { type: "json" };
import { parseProfileFromRehydration } from "../../src/extractors/tiktok/profileParser.js";

describe("parseProfileFromRehydration", () => {
  it("extracts creator profile fields and recent videos from a sanitized fixture", () => {
    const now = new Date("2026-07-17T00:00:00Z");
    const { creator, recentVideos } = parseProfileFromRehydration(
      profileFixture,
      "https://www.tiktok.com/@jalanjalanblokm",
      "jalanjalanblokm",
      5,
      now
    );

    expect(creator).not.toBeNull();
    expect(creator?.username).toBe("jalanjalanblokm");
    expect(creator?.followerCount).toBe(48_200);
    expect(creator?.totalLikeCount).toBe(1_700_000);
    expect(creator?.publicExternalLink).toBe("linktr.ee/jalanjalanblokm");

    expect(recentVideos).toHaveLength(3);
    // Most recent (by createTime) first.
    expect(recentVideos[0].platformVideoId).toBe("7123456789012345678");
  });

  it("returns a null creator when no user-shaped object is present", () => {
    const { creator, recentVideos } = parseProfileFromRehydration({}, "https://x", "someone", 5, new Date());
    expect(creator).toBeNull();
    expect(recentVideos).toEqual([]);
  });
});
