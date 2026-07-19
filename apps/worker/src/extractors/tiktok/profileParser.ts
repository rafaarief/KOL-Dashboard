import type { ExtractedCreator, ExtractedVideo } from "@kol-finder/schemas";
import { asNumber, asRecord, asString, findAllObjectsMatching } from "./jsonTreeSearch.js";
import { parseSearchResultsFromRehydration } from "./searchParser.js";

function isUserProfileShape(obj: Record<string, unknown>): boolean {
  const user = asRecord(obj.user);
  const stats = asRecord(obj.stats ?? obj.statsV2);
  return user !== null && typeof user.uniqueId === "string" && stats !== null && typeof stats.followerCount !== "undefined";
}

function userShapeToExtractedCreator(obj: Record<string, unknown>, profileUrl: string): ExtractedCreator | null {
  const user = asRecord(obj.user);
  const stats = asRecord(obj.stats ?? obj.statsV2);
  if (!user || !stats) return null;

  const username = asString(user.uniqueId);
  if (!username) return null;

  const bioLink = asRecord(user.bioLink);

  return {
    platformCreatorId: asString(user.id),
    username,
    displayName: asString(user.nickname),
    profileUrl,
    bio: asString(user.signature),
    profileImageUrl: asString(user.avatarLarger) ?? asString(user.avatarMedium),
    followerCount: asNumber(stats.followerCount),
    followingCount: asNumber(stats.followingCount),
    totalLikeCount: asNumber(stats.heartCount ?? stats.heart),
    isVerified: typeof user.verified === "boolean" ? user.verified : null,
    publicContactText: null,
    publicExternalLink: bioLink ? asString(bioLink.link) : null,
    extractionConfidence: 0.95,
  };
}

/** Pure, fixture-testable parser for a creator's profile page rehydration payload. */
export function parseProfileFromRehydration(
  data: unknown,
  profileUrl: string,
  username: string,
  recentVideoLimit: number,
  now: Date
): { creator: ExtractedCreator | null; recentVideos: ExtractedVideo[] } {
  const userShapes = findAllObjectsMatching(data, isUserProfileShape);
  const creator = userShapes.length > 0 ? userShapeToExtractedCreator(userShapes[0], profileUrl) : null;

  const allVideos = parseSearchResultsFromRehydration(data, "profile_refresh", now);
  const ownVideos = allVideos
    .filter((video) => video.creatorUsername.toLowerCase() === username.toLowerCase())
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, recentVideoLimit);

  return { creator, recentVideos: ownVideos };
}
