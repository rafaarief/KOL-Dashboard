import type { CreatorProfileResult, ExtractedVideo } from "@kol-finder/schemas";
import { ScraperError } from "@kol-finder/shared";
import { getApifyClient } from "./apifyClient.js";
import { apifyAuthorMetaToExtractedCreator, apifyItemToExtractedVideo } from "./apifyMappers.js";
import { config } from "../../config.js";
import { logger } from "../../logger.js";
import type { ScrapeCreatorInput } from "../tiktok/browserProfile.js";

/**
 * Profile-enrichment source backed by Apify instead of a Playwright browser. Same input/
 * output contract as browserProfile.ts's scrapeCreatorProfile.
 */
export async function scrapeCreatorProfileViaApify(input: ScrapeCreatorInput): Promise<CreatorProfileResult> {
  try {
    const run = await getApifyClient()
      .actor(config.apifyTikTokActorId)
      .call({
        profiles: [input.username],
        resultsPerPage: input.recentVideoLimit,
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        excludePinnedPosts: false,
        maxFollowersPerProfile: 0,
        maxFollowingPerProfile: 0,
        maxProfilesPerQuery: 1,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadAvatars: false,
        shouldDownloadMusicCovers: false,
        downloadSubtitlesOptions: "NEVER_DOWNLOAD_SUBTITLES",
        commentsPerPost: 0,
        proxyCountryCode: "None",
      });

    const { items } = await getApifyClient().dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) {
      throw new ScraperError("PROFILE_UNAVAILABLE", "Profile data not found or account is private", {
        profileUrl: input.profileUrl,
      });
    }

    const creator = apifyAuthorMetaToExtractedCreator(items[0]);
    if (!creator) {
      throw new ScraperError("PROFILE_UNAVAILABLE", "Could not parse profile author metadata", {
        profileUrl: input.profileUrl,
      });
    }

    const now = new Date();
    const recentVideos: ExtractedVideo[] = items
      .map((item) => apifyItemToExtractedVideo(item, "profile_refresh", now))
      .filter((video): video is ExtractedVideo => video !== null)
      .slice(0, input.recentVideoLimit);

    logger.info(
      { event: "profile_scraped_apify", username: input.username, videosCollected: recentVideos.length },
      "Creator profile scraped via Apify"
    );

    return { creator, recentVideos, warnings: [] };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError("NAVIGATION_TIMEOUT", `Apify profile fetch failed for @${input.username}`, {
      cause: String(error),
    });
  }
}
