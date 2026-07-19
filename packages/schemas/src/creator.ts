import { z } from "zod";
import { extractedVideoSchema } from "./video.js";

/** Public creator profile fields — see PRD section 8.4. No private/non-public data. */
export const extractedCreatorSchema = z.object({
  platformCreatorId: z.string().nullable().default(null),
  username: z.string().min(1),
  displayName: z.string().nullable().default(null),
  profileUrl: z.string().url(),
  bio: z.string().nullable().default(null),
  profileImageUrl: z.string().url().nullable().default(null),
  followerCount: z.number().int().nonnegative().nullable().default(null),
  followingCount: z.number().int().nonnegative().nullable().default(null),
  totalLikeCount: z.number().int().nonnegative().nullable().default(null),
  isVerified: z.boolean().nullable().default(null),
  publicContactText: z.string().nullable().default(null),
  publicExternalLink: z.string().nullable().default(null),
  extractionConfidence: z.number().min(0).max(1),
});
export type ExtractedCreator = z.infer<typeof extractedCreatorSchema>;

export const nicheClassificationSchema = z.object({
  primaryNiche: z.string(),
  secondaryNiches: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});
export type NicheClassification = z.infer<typeof nicheClassificationSchema>;

export const creatorProfileResultSchema = z.object({
  creator: extractedCreatorSchema,
  recentVideos: z.array(extractedVideoSchema),
  warnings: z.array(z.string()).default([]),
});
export type CreatorProfileResult = z.infer<typeof creatorProfileResultSchema>;
