import { eq } from "drizzle-orm";
import { getDb, schema } from "@kol-finder/database";
import type { ExtractedCreator, NicheClassification, NormalizedVideo } from "@kol-finder/schemas";
import { normalizeUsername } from "@kol-finder/shared";

export async function getCreatorById(creatorId: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.creators).where(eq(schema.creators.id, creatorId)).limit(1);
  return row ?? null;
}

export async function upsertCreator(
  creator: ExtractedCreator,
  niche: NicheClassification,
  inferredLocation: string | null,
  locationConfidence: number
): Promise<string> {
  const db = getDb();
  const normalizedUsername = normalizeUsername(creator.username);
  const now = new Date();

  const values = {
    platform: "tiktok",
    platformCreatorId: creator.platformCreatorId,
    username: creator.username,
    normalizedUsername,
    displayName: creator.displayName,
    profileUrl: creator.profileUrl,
    bio: creator.bio,
    profileImageUrl: creator.profileImageUrl,
    followerCount: creator.followerCount,
    followingCount: creator.followingCount,
    totalLikeCount: creator.totalLikeCount,
    isVerified: creator.isVerified,
    publicContactText: creator.publicContactText,
    publicExternalLink: creator.publicExternalLink,
    primaryNiche: niche.primaryNiche,
    secondaryNiches: niche.secondaryNiches,
    nicheConfidence: niche.confidence.toString(),
    nicheReason: niche.reason,
    inferredLocation,
    locationConfidence: locationConfidence.toString(),
    lastRefreshedAt: now,
    updatedAt: now,
  };

  const [row] = await db
    .insert(schema.creators)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.creators.platform, schema.creators.normalizedUsername],
      set: values,
    })
    .returning({ id: schema.creators.id });

  return row.id;
}

export async function replaceCreatorRecentVideos(creatorId: string, videos: NormalizedVideo[]): Promise<void> {
  const db = getDb();

  await db
    .delete(schema.videos)
    .where(eq(schema.videos.creatorId, creatorId));

  if (videos.length === 0) return;

  await db.insert(schema.videos).values(
    videos.map((video) => ({
      creatorId,
      platformVideoId: video.platformVideoId,
      videoUrl: video.videoUrl,
      caption: video.caption,
      hashtags: video.hashtags,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
      publishedAtEstimated: video.publishedAtEstimated,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      shareCount: video.shareCount,
      discoveryKeyword: video.searchKeyword,
      isRecentVideoSnapshot: true,
      extractionConfidence: video.extractionConfidence.toString(),
      collectedAt: new Date(video.collectedAt),
    }))
  );
}

export async function insertRelevantVideo(creatorId: string, video: NormalizedVideo): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(schema.videos)
    .values({
      creatorId,
      platformVideoId: video.platformVideoId,
      videoUrl: video.videoUrl,
      caption: video.caption,
      hashtags: video.hashtags,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
      publishedAtEstimated: video.publishedAtEstimated,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      shareCount: video.shareCount,
      discoveryKeyword: video.searchKeyword,
      isRecentVideoSnapshot: false,
      extractionConfidence: video.extractionConfidence.toString(),
      collectedAt: new Date(video.collectedAt),
    })
    .returning({ id: schema.videos.id });

  return row.id;
}

export async function insertCreatorMetricSnapshot(
  creatorId: string,
  creator: ExtractedCreator,
  metrics: {
    recentAverageViews: number | null;
    recentMedianViews: number | null;
    recentMaxViews: number | null;
    recentMinViews: number | null;
    recentOver10kCount: number;
    lastUploadAt: string | null;
  }
): Promise<void> {
  const db = getDb();
  await db.insert(schema.creatorMetricSnapshots).values({
    creatorId,
    followerCount: creator.followerCount,
    totalLikeCount: creator.totalLikeCount,
    recentAverageViews: metrics.recentAverageViews,
    recentMedianViews: metrics.recentMedianViews,
    recentMaxViews: metrics.recentMaxViews,
    recentMinViews: metrics.recentMinViews,
    recentOver10kCount: metrics.recentOver10kCount,
    lastUploadAt: metrics.lastUploadAt ? new Date(metrics.lastUploadAt) : null,
  });
}

export async function insertSearchResult(result: {
  searchId: string;
  creatorId: string;
  primaryVideoId: string;
  discoveryKeywords: string[];
  freshnessScore: number;
  relevantVideoScore: number;
  recentPerformanceScore: number;
  viewPerformanceScore: number;
  keywordRelevanceScore: number;
  finalScore: number;
  rankingLabel: string;
  rankingExplanation: string;
  rankPosition: number;
}): Promise<void> {
  const db = getDb();
  await db.insert(schema.searchResults).values({
    searchId: result.searchId,
    creatorId: result.creatorId,
    primaryVideoId: result.primaryVideoId,
    discoveryKeywords: result.discoveryKeywords,
    freshnessScore: result.freshnessScore.toString(),
    relevantVideoScore: result.relevantVideoScore.toString(),
    recentPerformanceScore: result.recentPerformanceScore.toString(),
    viewPerformanceScore: result.viewPerformanceScore.toString(),
    keywordRelevanceScore: result.keywordRelevanceScore.toString(),
    finalScore: result.finalScore.toString(),
    rankingLabel: result.rankingLabel,
    rankingExplanation: result.rankingExplanation,
    rankPosition: result.rankPosition,
  });
}
