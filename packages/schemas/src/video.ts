import { z } from "zod";

export const extractionStatusSchema = z.enum(["success", "partial", "failed"]);

/** Raw video fields collected straight from a public TikTok page — see PRD section 8.3. */
export const extractedVideoSchema = z.object({
  platformVideoId: z.string().nullable().default(null),
  videoUrl: z.string().url(),
  creatorUsername: z.string().min(1),
  creatorProfileUrl: z.string().url(),
  caption: z.string().nullable().default(null),
  hashtags: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().nullable().default(null),
  publishedAtEstimated: z.boolean().default(false),
  viewCount: z.number().int().nonnegative().nullable().default(null),
  likeCount: z.number().int().nonnegative().nullable().default(null),
  commentCount: z.number().int().nonnegative().nullable().default(null),
  shareCount: z.number().int().nonnegative().nullable().default(null),
  thumbnailUrl: z.string().url().nullable().default(null),
  searchKeyword: z.string().nullable().default(null),
  collectedAt: z.string().datetime(),
  rawText: z.string().nullable().default(null),
  extractionStatus: extractionStatusSchema,
  extractionConfidence: z.number().min(0).max(1),
});
export type ExtractedVideo = z.infer<typeof extractedVideoSchema>;

export const normalizedVideoSchema = extractedVideoSchema.extend({
  contentCategory: z.string().nullable().default(null),
  keywordRelevance: z.number().min(0).max(100).default(0),
  meetsViewThreshold: z.boolean().default(false),
});
export type NormalizedVideo = z.infer<typeof normalizedVideoSchema>;
