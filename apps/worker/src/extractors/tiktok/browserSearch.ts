import type { BrowserContext } from "playwright";
import type { ExtractedVideo } from "@kol-finder/schemas";
import { ScraperError } from "@kol-finder/shared";
import { assertPageIsAccessible } from "./accessGate.js";
import { extractRehydrationJson } from "./rehydrationData.js";
import { parseSearchResultsFromRehydration } from "./searchParser.js";
import { logger } from "../../logger.js";

export interface ScrapeSearchInput {
  searchId: string;
  keyword: string;
  maximumVideos: number;
}

export interface ScrapeSearchOutput {
  keyword: string;
  videos: ExtractedVideo[];
  extractionWarnings: string[];
}

const MAX_SCROLL_PASSES = 4;

/**
 * Loads TikTok's public video search page for a keyword and extracts candidate videos from
 * the embedded rehydration JSON. Per PRD safety rules this only reads what TikTok already
 * serves in the page response — no login, no CAPTCHA bypass. On CAPTCHA/login/access-denied
 * it throws a terminal ScraperError so the job stops instead of retrying forever.
 */
export async function scrapeSearchResults(
  context: BrowserContext,
  input: ScrapeSearchInput
): Promise<ScrapeSearchOutput> {
  const warnings: string[] = [];
  const page = await context.newPage();

  try {
    const url = `https://www.tiktok.com/search/video?q=${encodeURIComponent(input.keyword)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    let videos: ExtractedVideo[] = [];

    for (let pass = 0; pass < MAX_SCROLL_PASSES; pass += 1) {
      const html = await page.content();
      assertPageIsAccessible(html);

      const rehydrationData = extractRehydrationJson(html);
      if (!rehydrationData) {
        warnings.push("REHYDRATION_JSON_NOT_FOUND");
        break;
      }

      videos = parseSearchResultsFromRehydration(rehydrationData, input.keyword, new Date());

      if (videos.length >= input.maximumVideos) break;

      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(1200);
    }

    if (videos.length === 0 && warnings.length === 0) {
      warnings.push("NO_CANDIDATE_VIDEOS_FOUND");
    }

    logger.info(
      { event: "search_scraped", searchId: input.searchId, keyword: input.keyword, videoCount: videos.length },
      "Keyword search scraped"
    );

    return { keyword: input.keyword, videos: videos.slice(0, input.maximumVideos), extractionWarnings: warnings };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError("NAVIGATION_TIMEOUT", `Failed to load search results for "${input.keyword}"`, {
      cause: String(error),
    });
  } finally {
    await page.close();
  }
}
