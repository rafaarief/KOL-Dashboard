import type { NormalizedVideo } from "@kol-finder/schemas";
import { calculateCreatorRanking, explainRanking, type RankingBreakdown } from "@kol-finder/ranking";
import { daysSince } from "@kol-finder/shared";
import type { CreatorCandidate } from "../jobs/dedupeCandidates.js";

export interface CreatorMetrics {
  recentAverageViews: number | null;
  recentMedianViews: number | null;
  recentMaxViews: number | null;
  recentMinViews: number | null;
  recentOver10kCount: number;
  lastUploadAt: string | null;
  estimatedPostsPer30Days: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calculateCreatorMetrics(recentVideos: NormalizedVideo[]): CreatorMetrics {
  const views = recentVideos.map((video) => video.viewCount).filter((view): view is number => view !== null);

  const sortedByDate = [...recentVideos]
    .filter((video) => video.publishedAt !== null)
    .sort((a, b) => new Date(b.publishedAt as string).getTime() - new Date(a.publishedAt as string).getTime());

  const lastUploadAt = sortedByDate[0]?.publishedAt ?? null;
  const oldestUploadAt = sortedByDate[sortedByDate.length - 1]?.publishedAt ?? null;

  let estimatedPostsPer30Days: number | null = null;
  if (lastUploadAt && oldestUploadAt && sortedByDate.length > 1) {
    const spanDays = Math.max(
      1,
      (new Date(lastUploadAt).getTime() - new Date(oldestUploadAt).getTime()) / 86_400_000
    );
    estimatedPostsPer30Days = Math.round((sortedByDate.length / spanDays) * 30 * 10) / 10;
  }

  return {
    recentAverageViews: views.length > 0 ? Math.round(views.reduce((sum, v) => sum + v, 0) / views.length) : null,
    recentMedianViews: median(views),
    recentMaxViews: views.length > 0 ? Math.max(...views) : null,
    recentMinViews: views.length > 0 ? Math.min(...views) : null,
    recentOver10kCount: recentVideos.filter((video) => video.meetsViewThreshold).length,
    lastUploadAt,
    estimatedPostsPer30Days,
  };
}

export function scoreCreatorCandidate(
  candidate: CreatorCandidate,
  recentVideos: NormalizedVideo[],
  now: Date,
  location: string | null
): { breakdown: RankingBreakdown; metrics: CreatorMetrics; explanation: string } {
  const metrics = calculateCreatorMetrics(recentVideos);
  const daysSinceRelevantVideoUpload = daysSince(candidate.relevantVideo.publishedAt, now);

  const breakdown = calculateCreatorRanking({
    relevantVideoViews: candidate.relevantVideo.viewCount,
    daysSinceRelevantVideoUpload,
    recentVideoViews: recentVideos.map((video) => video.viewCount),
    keywordRelevance: candidate.relevantVideo.keywordRelevance,
  });

  const explanation = explainRanking(breakdown, {
    daysSinceRelevantVideoUpload,
    relevantVideoViews: candidate.relevantVideo.viewCount,
    recentVideosOver10k: metrics.recentOver10kCount,
    recentVideoCount: recentVideos.length,
    location,
  });

  return { breakdown, metrics, explanation };
}
