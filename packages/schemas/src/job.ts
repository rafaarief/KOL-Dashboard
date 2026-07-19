import { z } from "zod";

export const QUEUE_NAMES = {
  tiktokSearch: "tiktok-search",
  creatorRefresh: "creator-refresh",
} as const;

export const tiktokSearchJobSchema = z.object({
  jobType: z.literal("TIKTOK_CREATOR_SEARCH"),
  searchId: z.string().uuid(),
  requestedBy: z.string().uuid(),
});
export type TikTokSearchJob = z.infer<typeof tiktokSearchJobSchema>;

export const creatorRefreshJobSchema = z.object({
  jobType: z.literal("CREATOR_REFRESH"),
  creatorId: z.string().uuid(),
  requestedBy: z.string().uuid(),
});
export type CreatorRefreshJob = z.infer<typeof creatorRefreshJobSchema>;
