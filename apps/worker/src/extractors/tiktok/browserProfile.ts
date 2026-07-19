import type { BrowserContext } from "playwright";
import type { CreatorProfileResult } from "@kol-finder/schemas";
import { ScraperError } from "@kol-finder/shared";
import { assertPageIsAccessible } from "./accessGate.js";
import { extractRehydrationJson } from "./rehydrationData.js";
import { parseProfileFromRehydration } from "./profileParser.js";
import { logger } from "../../logger.js";

export interface ScrapeCreatorInput {
  profileUrl: string;
  username: string;
  recentVideoLimit: number;
}

/**
 * Loads a creator's public TikTok profile and extracts profile + up to N recent public
 * videos from the embedded rehydration JSON. Never touches private accounts or hidden data.
 */
export async function scrapeCreatorProfile(
  context: BrowserContext,
  input: ScrapeCreatorInput
): Promise<CreatorProfileResult> {
  const warnings: string[] = [];
  const page = await context.newPage();

  try {
    await page.goto(input.profileUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const html = await page.content();
    assertPageIsAccessible(html);

    const rehydrationData = extractRehydrationJson(html);
    if (!rehydrationData) {
      throw new ScraperError("SELECTOR_VERSION_MISMATCH", "Could not locate profile rehydration JSON", {
        profileUrl: input.profileUrl,
      });
    }

    const { creator, recentVideos } = parseProfileFromRehydration(
      rehydrationData,
      input.profileUrl,
      input.username,
      input.recentVideoLimit,
      new Date()
    );

    if (!creator) {
      throw new ScraperError("PROFILE_UNAVAILABLE", "Profile data not found or account is private", {
        profileUrl: input.profileUrl,
      });
    }

    logger.info(
      { event: "profile_scraped", username: input.username, videosCollected: recentVideos.length },
      "Creator profile scraped"
    );

    return { creator, recentVideos, warnings };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError("NAVIGATION_TIMEOUT", `Failed to load profile for @${input.username}`, {
      cause: String(error),
    });
  } finally {
    await page.close();
  }
}
