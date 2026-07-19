import type { ExtractedVideo } from "@kol-finder/schemas";
import { asNumber, asRecord, asString, findAllObjectsMatching } from "./jsonTreeSearch.js";

function isVideoItemShape(obj: Record<string, unknown>): boolean {
  const author = asRecord(obj.author);
  const stats = asRecord(obj.stats ?? obj.statsV2);
  const video = asRecord(obj.video);

  return (
    typeof obj.id !== "undefined" &&
    author !== null &&
    typeof author.uniqueId === "string" &&
    stats !== null &&
    (typeof stats.playCount !== "undefined" || typeof stats.diggCount !== "undefined") &&
    video !== null
  );
}

function extractHashtags(obj: Record<string, unknown>): string[] {
  const textExtra = obj.textExtra;
  if (Array.isArray(textExtra)) {
    const tags = textExtra
      .map((entry) => asRecord(entry))
      .map((entry) => (entry ? asString(entry.hashtagName) : null))
      .filter((tag): tag is string => Boolean(tag));
    if (tags.length > 0) return tags;
  }

  const desc = asString(obj.desc) ?? "";
  return Array.from(desc.matchAll(/#(\w+)/g)).map((match) => match[1]);
}

function videoItemToExtractedVideo(obj: Record<string, unknown>, keyword: string, now: Date): ExtractedVideo | null {
  const author = asRecord(obj.author);
  const stats = asRecord(obj.stats ?? obj.statsV2);
  const video = asRecord(obj.video);
  if (!author || !stats || !video) return null;

  const username = asString(author.uniqueId);
  const videoId = asString(obj.id) ?? String(obj.id ?? "");
  if (!username || !videoId) return null;

  const createTimeSeconds = asNumber(obj.createTime);
  const publishedAt = createTimeSeconds ? new Date(createTimeSeconds * 1000) : null;

  return {
    platformVideoId: videoId,
    videoUrl: `https://www.tiktok.com/@${username}/video/${videoId}`,
    creatorUsername: username,
    creatorProfileUrl: `https://www.tiktok.com/@${username}`,
    caption: asString(obj.desc),
    hashtags: extractHashtags(obj),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    publishedAtEstimated: false,
    viewCount: asNumber(stats.playCount),
    likeCount: asNumber(stats.diggCount),
    commentCount: asNumber(stats.commentCount),
    shareCount: asNumber(stats.shareCount),
    thumbnailUrl: asString(video.cover) ?? asString(video.dynamicCover) ?? asString(video.originCover),
    searchKeyword: keyword,
    collectedAt: now.toISOString(),
    rawText: null,
    extractionStatus: "success",
    extractionConfidence: 0.95,
  };
}

/** Pure, fixture-testable parser — see tests/fixtures/tiktok for sample rehydration payloads. */
export function parseSearchResultsFromRehydration(data: unknown, keyword: string, now: Date): ExtractedVideo[] {
  const items = findAllObjectsMatching(data, isVideoItemShape);
  const videos = items
    .map((item) => videoItemToExtractedVideo(item, keyword, now))
    .filter((video): video is ExtractedVideo => video !== null);

  const uniqueByVideoId = new Map<string, ExtractedVideo>();
  for (const video of videos) {
    if (video.platformVideoId) uniqueByVideoId.set(video.platformVideoId, video);
  }

  return Array.from(uniqueByVideoId.values());
}
