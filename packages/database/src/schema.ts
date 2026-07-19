import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("specialist"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const searches = pgTable("searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").notNull(),
  originalQuery: text("original_query").notNull(),
  parsedQuery: jsonb("parsed_query").notNull(),
  status: text("status").notNull().default("queued"),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  progressStep: text("progress_step"),
  candidateVideoCount: integer("candidate_video_count").notNull().default(0),
  qualifyingVideoCount: integer("qualifying_video_count").notNull().default(0),
  creatorCount: integer("creator_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const searchKeywords = pgTable("search_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => searches.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  keywordType: text("keyword_type").notNull().default("direct"), // direct | semantic | discovery
  processingStatus: text("processing_status").notNull().default("pending"),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creators = pgTable(
  "creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull().default("tiktok"),
    platformCreatorId: text("platform_creator_id"),
    username: text("username").notNull(),
    normalizedUsername: text("normalized_username").notNull(),
    displayName: text("display_name"),
    profileUrl: text("profile_url").notNull(),
    bio: text("bio"),
    profileImageUrl: text("profile_image_url"),
    followerCount: bigint("follower_count", { mode: "number" }),
    followingCount: bigint("following_count", { mode: "number" }),
    totalLikeCount: bigint("total_like_count", { mode: "number" }),
    isVerified: boolean("is_verified"),
    publicContactText: text("public_contact_text"),
    publicExternalLink: text("public_external_link"),
    primaryNiche: text("primary_niche"),
    secondaryNiches: jsonb("secondary_niches").notNull().default([]),
    nicheConfidence: numeric("niche_confidence", { precision: 4, scale: 3 }),
    nicheReason: text("niche_reason"),
    inferredLocation: text("inferred_location"),
    locationConfidence: numeric("location_confidence", { precision: 4, scale: 3 }),
    firstDiscoveredAt: timestamp("first_discovered_at", { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    platformUsernameUnique: uniqueIndex("creators_platform_normalized_username_idx").on(
      table.platform,
      table.normalizedUsername
    ),
  })
);

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  platformVideoId: text("platform_video_id"),
  videoUrl: text("video_url").notNull(),
  caption: text("caption"),
  hashtags: jsonb("hashtags").notNull().default([]),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedAtEstimated: boolean("published_at_estimated").notNull().default(false),
  viewCount: bigint("view_count", { mode: "number" }),
  likeCount: bigint("like_count", { mode: "number" }),
  commentCount: bigint("comment_count", { mode: "number" }),
  shareCount: bigint("share_count", { mode: "number" }),
  discoveryKeyword: text("discovery_keyword"),
  isRecentVideoSnapshot: boolean("is_recent_video_snapshot").notNull().default(false),
  extractionConfidence: numeric("extraction_confidence", { precision: 4, scale: 3 }).notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const searchResults = pgTable("search_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => searches.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  primaryVideoId: uuid("primary_video_id").references(() => videos.id),
  discoveryKeywords: jsonb("discovery_keywords").notNull().default([]),
  freshnessScore: numeric("freshness_score", { precision: 5, scale: 2 }).notNull(),
  relevantVideoScore: numeric("relevant_video_score", { precision: 5, scale: 2 }).notNull(),
  recentPerformanceScore: numeric("recent_performance_score", { precision: 5, scale: 2 }).notNull(),
  viewPerformanceScore: numeric("view_performance_score", { precision: 5, scale: 2 }).notNull(),
  keywordRelevanceScore: numeric("keyword_relevance_score", { precision: 5, scale: 2 }).notNull(),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }).notNull(),
  rankingLabel: text("ranking_label").notNull(),
  rankingExplanation: text("ranking_explanation").notNull(),
  rankPosition: integer("rank_position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorMetricSnapshots = pgTable("creator_metric_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  followerCount: bigint("follower_count", { mode: "number" }),
  totalLikeCount: bigint("total_like_count", { mode: "number" }),
  recentAverageViews: bigint("recent_average_views", { mode: "number" }),
  recentMedianViews: bigint("recent_median_views", { mode: "number" }),
  recentMaxViews: bigint("recent_max_views", { mode: "number" }),
  recentMinViews: bigint("recent_min_views", { mode: "number" }),
  recentOver10kCount: integer("recent_over_10k_count").notNull().default(0),
  lastUploadAt: timestamp("last_upload_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shortlists = pgTable("shortlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clientName: text("client_name"),
  campaignName: text("campaign_name"),
  campaignBrief: text("campaign_brief"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shortlistCreators = pgTable("shortlist_creators", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortlistId: uuid("shortlist_id")
    .notNull()
    .references(() => shortlists.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),
  searchResultId: uuid("search_result_id").references(() => searchResults.id),
  status: text("status").notNull().default("Discovered"),
  internalNotes: text("internal_notes"),
  proposedDeliverable: text("proposed_deliverable"),
  proposedPrice: numeric("proposed_price", { precision: 12, scale: 2 }),
  finalPrice: numeric("final_price", { precision: 12, scale: 2 }),
  addedBy: uuid("added_by").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scrapingEvents = pgTable("scraping_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").references(() => creators.id, { onDelete: "set null" }),
  jobId: text("job_id").notNull(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(),
  attempt: integer("attempt").notNull().default(1),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").notNull().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Nano KOL directory: curated roster (e.g. Blok M nano creators), imported from spreadsheets
// rather than scraped. Distinct from `creators` (search-pipeline scraped data). ---

export const nanoKols = pgTable(
  "nano_kols",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceRowNumber: integer("source_row_number"),
    fullName: text("full_name"),
    age: text("age"),
    gender: text("gender"),
    normalizedGender: text("normalized_gender"),
    domisili: text("domisili"),
    tiktokUsername: text("tiktok_username"),
    tiktokUrl: text("tiktok_url"),
    tiktokFollowersRaw: text("tiktok_followers_raw"),
    tiktokFollowersCount: bigint("tiktok_followers_count", { mode: "number" }),
    nicheTiktokRaw: text("niche_tiktok_raw"),
    erTiktokRaw: text("er_tiktok_raw"),
    avgViewsTiktokRaw: text("avg_views_tiktok_raw"),
    instagramUsername: text("instagram_username"),
    instagramUrl: text("instagram_url"),
    instagramFollowersRaw: text("instagram_followers_raw"),
    instagramFollowersCount: bigint("instagram_followers_count", { mode: "number" }),
    nicheInstagramRaw: text("niche_instagram_raw"),
    erInstagramRaw: text("er_instagram_raw"),
    avgViewsInstagramRaw: text("avg_views_instagram_raw"),
    contentReviewLink: text("content_review_link"),
    phoneNumber: text("phone_number"),
    note: text("note"),
    categories: jsonb("categories").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceRowUnique: uniqueIndex("nano_kols_source_row_number_idx").on(table.sourceRowNumber),
    domisiliIdx: index("nano_kols_domisili_idx").on(table.domisili),
    genderIdx: index("nano_kols_normalized_gender_idx").on(table.normalizedGender),
  })
);

// --- CariLeads: Google Maps business lead intelligence (Sprint 1.1) ---

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryName: text("category_name").notNull().unique(),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: text("business_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    phone: text("phone"),
    phoneType: text("phone_type"), // mobile | landline | unknown
    isWhatsappCandidate: boolean("is_whatsapp_candidate").notNull().default(false),
    website: text("website"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    email: text("email"),
    rating: numeric("rating", { precision: 2, scale: 1 }),
    reviewCount: integer("review_count").notNull().default(0),
    status: text("status"), // e.g. operational | closed_temporarily | closed_permanently
    address: text("address"),
    district: text("district"),
    city: text("city"),
    province: text("province"),
    postalCode: text("postal_code"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    leadScore: integer("lead_score").notNull().default(0),
    crmStatus: text("crm_status").notNull().default("New"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("businesses_category_id_idx").on(table.categoryId),
    cityIdx: index("businesses_city_idx").on(table.city),
    provinceIdx: index("businesses_province_idx").on(table.province),
  })
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one }) => ({
  category: one(categories, { fields: [businesses.categoryId], references: [categories.id] }),
}));

export const searchesRelations = relations(searches, ({ many }) => ({
  keywords: many(searchKeywords),
  results: many(searchResults),
}));

export const creatorsRelations = relations(creators, ({ many }) => ({
  videos: many(videos),
  results: many(searchResults),
  metricSnapshots: many(creatorMetricSnapshots),
}));

export const shortlistsRelations = relations(shortlists, ({ many }) => ({
  creators: many(shortlistCreators),
}));
