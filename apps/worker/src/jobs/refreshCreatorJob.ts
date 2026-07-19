import { parsedQuerySchema, type CreatorRefreshJob } from "@kol-finder/schemas";
import { classifyNiche } from "@kol-finder/ai";
import { browserManager } from "../browser/browserManager.js";
import { scrapeCreatorProfile } from "../extractors/tiktok/browserProfile.js";
import { normalizeVideo } from "../normalizers/videoNormalizer.js";
import { getCreatorById, insertCreatorMetricSnapshot, replaceCreatorRecentVideos, upsertCreator } from "../repositories/creatorRepository.js";
import { calculateCreatorMetrics } from "../ranking/scoreCreator.js";
import { recordScrapingEvent } from "../repositories/searchRepository.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

/** FR-020 — on-demand profile-data refresh, outside the context of any specific search. */
export async function runCreatorRefreshJob(payload: CreatorRefreshJob): Promise<void> {
  const creator = await getCreatorById(payload.creatorId);
  if (!creator) {
    logger.warn({ event: "creator_refresh_skipped", creatorId: payload.creatorId }, "Creator not found");
    return;
  }

  const neutralQuery = parsedQuerySchema.parse({
    primaryKeyword: creator.primaryNiche ?? creator.username,
    keywordVariations: [creator.primaryNiche ?? creator.username],
    location: creator.inferredLocation,
    minimumViews: config.defaultMinimumViews,
    recentVideoLimit: config.recentVideoLimit,
  });

  try {
    const profile = await browserManager.withContext((context) =>
      scrapeCreatorProfile(context, {
        profileUrl: creator.profileUrl,
        username: creator.username,
        recentVideoLimit: config.recentVideoLimit,
      })
    );

    const recentVideos = profile.recentVideos.map((video) => normalizeVideo(video, neutralQuery));

    const niche = await classifyNiche({
      bio: profile.creator.bio,
      recentCaptions: recentVideos.map((video) => video.caption ?? "").filter(Boolean),
      hashtags: recentVideos.flatMap((video) => video.hashtags),
    });

    const creatorId = await upsertCreator(profile.creator, niche, creator.inferredLocation, Number(creator.locationConfidence ?? 0));
    await replaceCreatorRecentVideos(creatorId, recentVideos);
    await insertCreatorMetricSnapshot(creatorId, profile.creator, calculateCreatorMetrics(recentVideos));

    logger.info({ event: "creator_refreshed", creatorId }, "Creator profile refreshed");
  } catch (error) {
    await recordScrapingEvent({
      creatorId: payload.creatorId,
      jobId: payload.creatorId,
      eventType: "creator_refresh",
      status: "failed",
      errorMessage: String(error),
    });
    throw error;
  }
}
