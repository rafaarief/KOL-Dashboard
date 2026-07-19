import type { ExtractedCreator, ExtractedVideo } from "@kol-finder/schemas";
import { asNumber, asRecord, asString } from "../tiktok/jsonTreeSearch.js";

/**
 * Maps one dataset item from clockworks/tiktok-scraper (Apify actor `GdWCkxBtKWOsKjdch`) to
 * this project's ExtractedVideo shape, so downstream normalization/ranking/storage code
 * (normalizeVideo, dedupeCandidateCreators, creatorRepository) doesn't need to know which
 * scraper produced the data — mirrors what searchParser.ts does for the Playwright path.
 */
export function apifyItemToExtractedVideo(item: unknown, searchKeyword: string | null, now: Date): ExtractedVideo | null {
  const record = asRecord(item);
  if (!record) return null;

  const authorMeta = asRecord(record.authorMeta);
  const videoMeta = asRecord(record.videoMeta);
  const creatorUsername = authorMeta ? asString(authorMeta.name) : null;
  const videoUrl = asString(record.webVideoUrl);
  if (!creatorUsername || !videoUrl) return null;

  const hashtags = Array.isArray(record.hashtags)
    ? record.hashtags
        .map((tag) => asString(asRecord(tag)?.name) ?? asString(tag))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  const createTimeISO = asString(record.createTimeISO);
  const createTimeSeconds = asNumber(record.createTime);

  return {
    platformVideoId: asString(record.id),
    videoUrl,
    creatorUsername,
    creatorProfileUrl: `https://www.tiktok.com/@${creatorUsername}`,
    caption: asString(record.text),
    hashtags,
    publishedAt: createTimeISO ?? (createTimeSeconds ? new Date(createTimeSeconds * 1000).toISOString() : null),
    publishedAtEstimated: false,
    viewCount: asNumber(record.playCount),
    likeCount: asNumber(record.diggCount),
    commentCount: asNumber(record.commentCount),
    shareCount: asNumber(record.shareCount),
    thumbnailUrl: videoMeta ? asString(videoMeta.coverUrl) : null,
    searchKeyword,
    collectedAt: now.toISOString(),
    rawText: asString(record.text),
    extractionStatus: "success",
    extractionConfidence: 0.9,
  };
}

/** Maps an Apify `authorMeta` object (present on every video item) to this project's ExtractedCreator shape. */
export function apifyAuthorMetaToExtractedCreator(item: unknown): ExtractedCreator | null {
  const record = asRecord(item);
  const authorMeta = record ? asRecord(record.authorMeta) : asRecord(item);
  if (!authorMeta) return null;

  const username = asString(authorMeta.name);
  if (!username) return null;

  return {
    platformCreatorId: asString(authorMeta.id),
    username,
    displayName: asString(authorMeta.nickName),
    profileUrl: asString(authorMeta.profileUrl) ?? `https://www.tiktok.com/@${username}`,
    bio: asString(authorMeta.signature),
    profileImageUrl: asString(authorMeta.avatar),
    followerCount: asNumber(authorMeta.fans),
    followingCount: asNumber(authorMeta.following),
    totalLikeCount: asNumber(authorMeta.heart),
    isVerified: typeof authorMeta.verified === "boolean" ? authorMeta.verified : null,
    publicContactText: null,
    publicExternalLink: asString(authorMeta.bioLink),
    extractionConfidence: 0.85,
  };
}
