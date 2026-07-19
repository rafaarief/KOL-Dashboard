import type { ExtractedVideo, NormalizedVideo, ParsedQuery } from "@kol-finder/schemas";
import { calculateKeywordRelevanceScore } from "@kol-finder/ranking";
import { classifyContentCategory } from "./contentCategory.js";
import { scoreKeywordRelevance } from "./keywordRelevance.js";

export function normalizeVideo(video: ExtractedVideo, parsedQuery: ParsedQuery): NormalizedVideo {
  const keywordRelevanceInputs = scoreKeywordRelevance(video, parsedQuery);
  const keywordRelevance = calculateKeywordRelevanceScore(keywordRelevanceInputs);

  return {
    ...video,
    contentCategory: classifyContentCategory(video.caption, video.hashtags),
    keywordRelevance,
    meetsViewThreshold: video.viewCount !== null && video.viewCount >= parsedQuery.minimumViews,
  };
}
