import type { ExtractedVideo } from "@kol-finder/schemas";
import { ScraperError } from "@kol-finder/shared";
import { getApifyClient } from "./apifyClient.js";
import { apifyItemToExtractedVideo } from "./apifyMappers.js";
import { config } from "../../config.js";
import { logger } from "../../logger.js";
import type { ScrapeSearchInput, ScrapeSearchOutput } from "../tiktok/browserSearch.js";

/**
 * Keyword-search source backed by the Apify `clockworks/tiktok-scraper` actor instead of a
 * Playwright browser. Same input/output contract as browserSearch.ts's scrapeSearchResults
 * so searchJob.ts can swap sources via config.scraperSource without touching the rest of
 * the pipeline (dedup, ranking, DB writes).
 */
export async function scrapeSearchResultsViaApify(input: ScrapeSearchInput): Promise<ScrapeSearchOutput> {
  const warnings: string[] = [];

  try {
    const run = await getApifyClient()
      .actor(config.apifyTikTokActorId)
      .call({
        searchQueries: [input.keyword],
        hashtags: [],
        resultsPerPage: Math.min(input.maximumVideos, 100),
        searchSection: "",
        videoSearchSorting: "MOST_RELEVANT",
        videoSearchDateFilter: "ALL_TIME",
        excludePinnedPosts: false,
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

    const now = new Date();
    const videos: ExtractedVideo[] = items
      .map((item) => apifyItemToExtractedVideo(item, input.keyword, now))
      .filter((video): video is ExtractedVideo => video !== null)
      .slice(0, input.maximumVideos);

    if (videos.length === 0) warnings.push("NO_CANDIDATE_VIDEOS_FOUND");

    logger.info(
      { event: "search_scraped_apify", searchId: input.searchId, keyword: input.keyword, videoCount: videos.length },
      "Keyword search scraped via Apify"
    );

    return { keyword: input.keyword, videos, extractionWarnings: warnings };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError("NAVIGATION_TIMEOUT", `Apify search failed for "${input.keyword}"`, {
      cause: String(error),
    });
  }
}
