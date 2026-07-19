import { z } from "zod";

export const sortModeSchema = z.enum([
  "balanced",
  "best_match",
  "most_recent",
  "highest_views",
  "highest_followers",
]);

export const searchQueryRequestSchema = z.object({
  query: z.string().min(2).max(500),
});
export type SearchQueryRequest = z.infer<typeof searchQueryRequestSchema>;

/** Output of the query interpreter (AI or deterministic fallback) — see PRD section 18.1. */
export const parsedQuerySchema = z.object({
  primaryKeyword: z.string().min(1),
  keywordVariations: z.array(z.string().min(1)).min(1).max(12),
  category: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  nicheHints: z.array(z.string()).default([]),
  timeRangeDays: z.number().int().positive().nullable().default(null),
  minimumViews: z.number().int().nonnegative().default(10_000),
  minimumFollowers: z.number().int().nonnegative().nullable().default(null),
  maximumFollowers: z.number().int().nonnegative().nullable().default(null),
  creatorType: z.string().nullable().default(null),
  maximumCreators: z.number().int().positive().max(200).default(30),
  recentVideoLimit: z.number().int().positive().max(10).default(5),
  sortMode: sortModeSchema.default("balanced"),
});
export type ParsedQuery = z.infer<typeof parsedQuerySchema>;
