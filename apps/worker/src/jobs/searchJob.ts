import { eq } from "drizzle-orm";
import { getDb, schema } from "@kol-finder/database";
import { parsedQuerySchema, type NormalizedVideo, type TikTokSearchJob } from "@kol-finder/schemas";
import { classifyNiche } from "@kol-finder/ai";
import { ScraperError } from "@kol-finder/shared";
import { browserManager } from "../browser/browserManager.js";
import { scrapeSearchResults, type ScrapeSearchOutput } from "../extractors/tiktok/browserSearch.js";
import { scrapeCreatorProfile } from "../extractors/tiktok/browserProfile.js";
import { scrapeSearchResultsViaApify } from "../extractors/apify/apifySearch.js";
import { scrapeCreatorProfileViaApify } from "../extractors/apify/apifyProfile.js";
import { normalizeVideo } from "../normalizers/videoNormalizer.js";
import { config } from "../config.js";
import { dedupeCandidateCreators } from "./dedupeCandidates.js";
import { scoreCreatorCandidate } from "../ranking/scoreCreator.js";
import {
  isSearchCancelled,
  markSearchStatus,
  recordScrapingEvent,
  recordSearchKeyword,
  updateSearchKeywordResult,
} from "../repositories/searchRepository.js";
import {
  insertCreatorMetricSnapshot,
  insertRelevantVideo,
  insertSearchResult,
  replaceCreatorRecentVideos,
  upsertCreator,
} from "../repositories/creatorRepository.js";
import { logger } from "../logger.js";

async function loadSearch(searchId: string) {
  const db = getDb();
  const [search] = await db.select().from(schema.searches).where(eq(schema.searches.id, searchId)).limit(1);
  if (!search) throw new Error(`Search ${searchId} not found`);
  return search;
}

/** Dispatches to the Apify actor or the Playwright browser depending on config.scraperSource. */
async function fetchSearchResults(searchId: string, keyword: string, maximumVideos: number): Promise<ScrapeSearchOutput> {
  if (config.scraperSource === "apify") {
    return scrapeSearchResultsViaApify({ searchId, keyword, maximumVideos });
  }
  return browserManager.withContext((context) => scrapeSearchResults(context, { searchId, keyword, maximumVideos }));
}

async function fetchCreatorProfile(profileUrl: string, username: string, recentVideoLimit: number) {
  if (config.scraperSource === "apify") {
    return scrapeCreatorProfileViaApify({ profileUrl, username, recentVideoLimit });
  }
  return browserManager.withContext((context) =>
    scrapeCreatorProfile(context, { profileUrl, username, recentVideoLimit })
  );
}

/**
 * The main search pipeline — mirrors PRD section 21 step by step. A single creator or
 * keyword failing must not fail the whole search (PRD 10.1 reliability); only terminal
 * ScraperErrors (CAPTCHA/login/access-denied) stop the job outright.
 */
export async function runSearchJob(payload: TikTokSearchJob): Promise<void> {
  const { searchId } = payload;
  const search = await loadSearch(searchId);
  const parsedQuery = parsedQuerySchema.parse(search.parsedQuery);

  await markSearchStatus(searchId, { status: "running", startedAt: new Date(), progressStep: "generating_keywords" });

  let candidateVideos: NormalizedVideo[] = [];
  let errorCount = 0;

  try {
    for (const keyword of parsedQuery.keywordVariations) {
      if (await isSearchCancelled(searchId)) break;

      const keywordId = await recordSearchKeyword(searchId, keyword, keyword === parsedQuery.primaryKeyword ? "direct" : "semantic");

      try {
        const result = await fetchSearchResults(searchId, keyword, parsedQuery.maximumCreators * 2);

        const normalized = result.videos.map((video) => normalizeVideo(video, parsedQuery));
        candidateVideos.push(...normalized);

        await updateSearchKeywordResult(keywordId, result.videos.length, "completed");
      } catch (error) {
        errorCount += 1;
        await updateSearchKeywordResult(keywordId, 0, "failed");
        await recordScrapingEvent({
          searchId,
          jobId: searchId,
          eventType: "keyword_search",
          status: "failed",
          errorCode: error instanceof ScraperError ? error.code : "NAVIGATION_TIMEOUT",
          errorMessage: String(error),
        });

        if (error instanceof ScraperError && error.isTerminal) throw error;
      }
    }
  } catch (error) {
    if (error instanceof ScraperError && error.isTerminal) {
      await markSearchStatus(searchId, {
        status: "failed",
        progressStep: error.code,
        completedAt: new Date(),
        errorCount: errorCount + 1,
      });
      await recordScrapingEvent({
        searchId,
        jobId: searchId,
        eventType: "search_job",
        status: "terminal_failure",
        errorCode: error.code,
        errorMessage: error.message,
      });
      return;
    }
    throw error;
  }

  if (await isSearchCancelled(searchId)) return;

  await markSearchStatus(searchId, {
    progressStep: "deduplicating_creators",
    candidateVideoCount: candidateVideos.length,
    qualifyingVideoCount: candidateVideos.filter((video) => video.meetsViewThreshold).length,
  });

  const sortedCandidates = [...candidateVideos].sort((a, b) => {
    if (a.meetsViewThreshold !== b.meetsViewThreshold) return a.meetsViewThreshold ? -1 : 1;
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  const creatorCandidates = dedupeCandidateCreators(sortedCandidates).slice(0, parsedQuery.maximumCreators);

  await markSearchStatus(searchId, { progressStep: "inspecting_profiles", creatorCount: creatorCandidates.length });

  const now = new Date();
  let rankPosition = 0;

  for (const candidate of creatorCandidates) {
    if (await isSearchCancelled(searchId)) return;

    try {
      const profile = await fetchCreatorProfile(candidate.profileUrl, candidate.username, parsedQuery.recentVideoLimit);

      const recentVideos = profile.recentVideos.map((video) => normalizeVideo(video, parsedQuery));

      const niche = await classifyNiche({
        bio: profile.creator.bio,
        recentCaptions: recentVideos.map((video) => video.caption ?? "").filter(Boolean),
        hashtags: recentVideos.flatMap((video) => video.hashtags),
      });

      const creatorId = await upsertCreator(profile.creator, niche, parsedQuery.location, parsedQuery.location ? 0.6 : 0);
      await replaceCreatorRecentVideos(creatorId, recentVideos);

      const { breakdown, metrics, explanation } = scoreCreatorCandidate(candidate, recentVideos, now, parsedQuery.location);
      await insertCreatorMetricSnapshot(creatorId, profile.creator, metrics);

      const primaryVideoId = await insertRelevantVideo(creatorId, candidate.relevantVideo);

      rankPosition += 1;
      await insertSearchResult({
        searchId,
        creatorId,
        primaryVideoId,
        discoveryKeywords: candidate.discoveryKeywords,
        freshnessScore: breakdown.freshnessScore,
        relevantVideoScore: breakdown.relevantVideoScore,
        recentPerformanceScore: breakdown.recentPerformanceScore,
        viewPerformanceScore: breakdown.viewPerformanceScore,
        keywordRelevanceScore: breakdown.keywordRelevanceScore,
        finalScore: breakdown.finalScore,
        rankingLabel: breakdown.label,
        rankingExplanation: explanation,
        rankPosition,
      });
    } catch (error) {
      errorCount += 1;
      await recordScrapingEvent({
        searchId,
        jobId: searchId,
        eventType: "profile_scrape",
        status: "failed",
        errorCode: error instanceof ScraperError ? error.code : "PROFILE_UNAVAILABLE",
        errorMessage: String(error),
        metadata: { username: candidate.username },
      });

      if (error instanceof ScraperError && error.isTerminal) {
        await markSearchStatus(searchId, { status: "failed", progressStep: error.code, completedAt: new Date(), errorCount });
        return;
      }

      logger.warn({ event: "profile_scrape_failed", username: candidate.username, error: String(error) }, "Skipping creator");
    }
  }

  await markSearchStatus(searchId, {
    status: "completed",
    progressStep: "completed",
    progressPercentage: 100,
    errorCount,
    completedAt: new Date(),
  });
}
