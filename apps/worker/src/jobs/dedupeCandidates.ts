import type { NormalizedVideo } from "@kol-finder/schemas";
import { normalizeUsername } from "@kol-finder/shared";

export interface CreatorCandidate {
  normalizedUsername: string;
  username: string;
  profileUrl: string;
  discoveryKeywords: string[];
  relevantVideo: NormalizedVideo;
  allDiscoveredVideos: NormalizedVideo[];
}

/**
 * Groups discovered videos by creator (PRD section 18.9). A creator found through multiple
 * keywords keeps ONE record, the union of keywords, and its single strongest video for
 * primary ranking — so one extremely viral clip can't be double counted.
 */
export function dedupeCandidateCreators(videos: NormalizedVideo[]): CreatorCandidate[] {
  const groups = new Map<string, CreatorCandidate>();

  for (const video of videos) {
    const key = normalizeUsername(video.creatorUsername);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        normalizedUsername: key,
        username: video.creatorUsername,
        profileUrl: video.creatorProfileUrl,
        discoveryKeywords: video.searchKeyword ? [video.searchKeyword] : [],
        relevantVideo: video,
        allDiscoveredVideos: [video],
      });
      continue;
    }

    existing.allDiscoveredVideos.push(video);
    if (video.searchKeyword && !existing.discoveryKeywords.includes(video.searchKeyword)) {
      existing.discoveryKeywords.push(video.searchKeyword);
    }

    const isStrongerVideo =
      (video.viewCount ?? -1) > (existing.relevantVideo.viewCount ?? -1) ||
      (video.viewCount === existing.relevantVideo.viewCount && video.keywordRelevance > existing.relevantVideo.keywordRelevance);

    if (isStrongerVideo) {
      existing.relevantVideo = video;
    }
  }

  return Array.from(groups.values());
}
