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

/** `role` is a free-text column (not a DB enum) so the pre-existing "specialist" rows used by
 * internal KOL Finder automation (see getDefaultUserId()) keep working untouched. OpenCollab
 * app code should only ever write "creator" | "brand" | "admin" | "specialist" here. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("specialist"),
  passwordHash: text("password_hash"),
  // active | suspended — enforced at login in auth.ts, not just hidden in the UI.
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** Auth.js (NextAuth v5) Drizzle adapter tables — only Credentials/JWT auth is wired up today,
 * but these keep the schema ready for OAuth providers later without another migration. */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("accounts_provider_account_idx").on(table.provider, table.providerAccountId),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    identifierTokenUnique: uniqueIndex("verification_tokens_identifier_token_idx").on(table.identifier, table.token),
  })
);

export const searches = pgTable("searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
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
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
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
  addedBy: uuid("added_by")
    .notNull()
    .references(() => users.id),
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

// --- BoothyClub KOL visit tracker: campaign/visit log (which creator visited which branch,
// posting status), imported from the "BOOTHYCLUB - KOL DATABASE" sheet. Distinct from
// `nanoKols` (a static contact directory) — this is per-visit campaign activity. ---

export const kolVisits = pgTable(
  "kol_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceRowNumber: integer("source_row_number"),
    month: text("month"),
    week: text("week"),
    name: text("name"),
    platform: text("platform"),
    tier: text("tier"),
    branch: text("branch"),
    visitDate: text("visit_date"),
    deadline: text("deadline"),
    status: text("status"),
    normalizedStatus: text("normalized_status"),
    accountLink: text("account_link"),
    postLink: text("post_link"),
    currentStatus: text("current_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceRowUnique: uniqueIndex("kol_visits_source_row_number_idx").on(table.sourceRowNumber),
    branchIdx: index("kol_visits_branch_idx").on(table.branch),
    tierIdx: index("kol_visits_tier_idx").on(table.tier),
    statusIdx: index("kol_visits_normalized_status_idx").on(table.normalizedStatus),
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

// ============================================================================
// OpenCollab.id — brand/creator collaboration marketplace
//
// Reuses the existing `searches` / `creators` / `videos` / `search_results` tables above as
// the KOL-scrape data source (the spec's "kol_scrape_searches"/"kol_scrape_results" — not
// duplicated here). `categories` above belongs to the separate Business Leads product; the
// marketplace's own taxonomy table is named `marketplace_categories` to avoid collision.
// ============================================================================

export const marketplaceCategories = pgTable("marketplace_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const niches = pgTable("niches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platforms = pgTable("platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const collaborationTypes = pgTable("collaboration_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const creatorProfiles = pgTable(
  "creator_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    city: text("city"),
    bio: text("bio"),
    // Self-reported, not auto-generated from other fields — a creator-owned professional
    // headline reads as more credible than something we synthesized for them. Public profile
    // falls back to a synthesized "{niche} Creator • {city}" string when this is empty.
    headline: text("headline"),
    languages: jsonb("languages").notNull().default([]),
    yearsOfExperience: integer("years_of_experience"),
    avatarUrl: text("avatar_url"),
    coverImageUrl: text("cover_image_url"),
    primaryNicheId: uuid("primary_niche_id").references(() => niches.id),
    availabilityStatus: text("availability_status").notNull().default("open"), // open | limited | fully_booked | unavailable
    availableFrom: timestamp("available_from", { withTimezone: true }),
    availableUntil: timestamp("available_until", { withTimezone: true }),
    monthlyCapacity: integer("monthly_capacity"),
    slotsRemaining: integer("slots_remaining"),
    minimumBudget: numeric("minimum_budget", { precision: 14, scale: 2 }),
    acceptsBarter: boolean("accepts_barter").notNull().default(false),
    acceptsAffiliate: boolean("accepts_affiliate").notNull().default(false),
    acceptsPaid: boolean("accepts_paid").notNull().default(true),
    acceptsEventAttendance: boolean("accepts_event_attendance").notNull().default(false),
    acceptsAmbassador: boolean("accepts_ambassador").notNull().default(false),
    contactEmail: text("contact_email"),
    contactWhatsapp: text("contact_whatsapp"),
    contactVisible: boolean("contact_visible").notNull().default(false),
    verificationStatus: text("verification_status").notNull().default("unverified"), // unverified | pending | verified | rejected
    featured: boolean("featured").notNull().default(false),
    status: text("status").notNull().default("active"), // active | suspended
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    availabilityIdx: index("creator_profiles_availability_idx").on(table.availabilityStatus),
    nicheIdx: index("creator_profiles_niche_idx").on(table.primaryNicheId),
    statusIdx: index("creator_profiles_status_idx").on(table.status),
  })
);

export const creatorNiches = pgTable(
  "creator_niches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorProfileId: uuid("creator_profile_id")
      .notNull()
      .references(() => creatorProfiles.id, { onDelete: "cascade" }),
    nicheId: uuid("niche_id")
      .notNull()
      .references(() => niches.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePair: uniqueIndex("creator_niches_unique_idx").on(table.creatorProfileId, table.nicheId),
  })
);

export const creatorSocialAccounts = pgTable(
  "creator_social_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorProfileId: uuid("creator_profile_id")
      .notNull()
      .references(() => creatorProfiles.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    username: text("username").notNull(),
    profileUrl: text("profile_url"),
    followerCount: bigint("follower_count", { mode: "number" }).notNull().default(0),
    averageViews: bigint("average_views", { mode: "number" }),
    engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePlatformUsername: uniqueIndex("creator_social_accounts_platform_username_idx").on(
      table.platformId,
      table.username
    ),
    creatorIdx: index("creator_social_accounts_creator_idx").on(table.creatorProfileId),
  })
);

export const creatorRateCards = pgTable("creator_rate_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorProfileId: uuid("creator_profile_id")
    .notNull()
    .references(() => creatorProfiles.id, { onDelete: "cascade" }),
  deliverableType: text("deliverable_type").notNull(),
  price: numeric("price", { precision: 14, scale: 2 }),
  visibility: text("visibility").notNull().default("starting_from"), // public | starting_from | negotiable | contact
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorPortfolioItems = pgTable("creator_portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorProfileId: uuid("creator_profile_id")
    .notNull()
    .references(() => creatorProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  mediaUrl: text("media_url"),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorBrandExperiences = pgTable("creator_brand_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorProfileId: uuid("creator_profile_id")
    .notNull()
    .references(() => creatorProfiles.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  description: text("description"),
  year: integer("year"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    slug: text("slug").notNull().unique(),
    brandName: text("brand_name").notNull(),
    industry: text("industry"),
    city: text("city"),
    logoUrl: text("logo_url"),
    description: text("description"),
    website: text("website"),
    contactEmail: text("contact_email"),
    contactVisible: boolean("contact_visible").notNull().default(false),
    verificationStatus: text("verification_status").notNull().default("unverified"),
    featured: boolean("featured").notNull().default(false),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    industryIdx: index("brand_profiles_industry_idx").on(table.industry),
    statusIdx: index("brand_profiles_status_idx").on(table.status),
  })
);

export const brandSocialAccounts = pgTable("brand_social_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandProfileId: uuid("brand_profile_id")
    .notNull()
    .references(() => brandProfiles.id, { onDelete: "cascade" }),
  platformId: uuid("platform_id")
    .notNull()
    .references(() => platforms.id),
  url: text("url").notNull(),
});

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandProfileId: uuid("brand_profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id").references(() => marketplaceCategories.id),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(),
    productOrService: text("product_or_service"),
    locationType: text("location_type").notNull().default("remote"), // remote | onsite | hybrid
    city: text("city"),
    province: text("province"),
    isRemote: boolean("is_remote").notNull().default(true),
    creatorCountNeeded: integer("creator_count_needed").notNull().default(1),
    creatorCountAccepted: integer("creator_count_accepted").notNull().default(0),
    budgetType: text("budget_type").notNull().default("fixed"), // fixed | range | barter | affiliate | negotiable
    budgetMin: numeric("budget_min", { precision: 14, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 14, scale: 2 }),
    budgetPerCreator: numeric("budget_per_creator", { precision: 14, scale: 2 }),
    currency: text("currency").notNull().default("IDR"),
    compensationType: text("compensation_type").notNull().default("paid"),
    deliverables: jsonb("deliverables").notNull().default([]),
    requirements: text("requirements"),
    requiredLanguage: text("required_language"),
    usageRights: text("usage_rights"),
    minimumFollowers: integer("minimum_followers"),
    maximumFollowers: integer("maximum_followers"),
    preferredCreatorTypes: jsonb("preferred_creator_types").notNull().default([]),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    contentDeadline: timestamp("content_deadline", { withTimezone: true }),
    campaignStartDate: timestamp("campaign_start_date", { withTimezone: true }),
    campaignEndDate: timestamp("campaign_end_date", { withTimezone: true }),
    status: text("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    // External image URL only — no upload pipeline this sprint. Card rendering falls back to a
    // category-based generated visual when this is empty.
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("campaigns_status_idx").on(table.status),
    brandIdx: index("campaigns_brand_idx").on(table.brandProfileId),
    categoryIdx: index("campaigns_category_idx").on(table.categoryId),
  })
);

export const campaignNiches = pgTable(
  "campaign_niches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    nicheId: uuid("niche_id")
      .notNull()
      .references(() => niches.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePair: uniqueIndex("campaign_niches_unique_idx").on(table.campaignId, table.nicheId),
  })
);

export const campaignPlatforms = pgTable(
  "campaign_platforms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePair: uniqueIndex("campaign_platforms_unique_idx").on(table.campaignId, table.platformId),
  })
);

export const campaignApplications = pgTable(
  "campaign_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    creatorProfileId: uuid("creator_profile_id")
      .notNull()
      .references(() => creatorProfiles.id, { onDelete: "cascade" }),
    pitch: text("pitch").notNull(),
    proposedRate: numeric("proposed_rate", { precision: 14, scale: 2 }),
    selectedSocialAccountId: uuid("selected_social_account_id").references(() => creatorSocialAccounts.id),
    portfolioLinks: jsonb("portfolio_links").notNull().default([]),
    estimatedDeliveryDays: integer("estimated_delivery_days"),
    note: text("note"),
    status: text("status").notNull().default("submitted"), // submitted | viewed | shortlisted | accepted | rejected | withdrawn
    // Admin-internal only — never returned to creator/brand API responses.
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueApplication: uniqueIndex("campaign_applications_unique_idx").on(table.campaignId, table.creatorProfileId),
    campaignIdx: index("campaign_applications_campaign_idx").on(table.campaignId),
    creatorIdx: index("campaign_applications_creator_idx").on(table.creatorProfileId),
    statusIdx: index("campaign_applications_status_idx").on(table.status),
  })
);

export const campaignInvitations = pgTable(
  "campaign_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    creatorProfileId: uuid("creator_profile_id")
      .notNull()
      .references(() => creatorProfiles.id, { onDelete: "cascade" }),
    brandProfileId: uuid("brand_profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    message: text("message"),
    status: text("status").notNull().default("pending"), // pending | accepted | declined
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueInvitation: uniqueIndex("campaign_invitations_unique_idx").on(table.campaignId, table.creatorProfileId),
  })
);

export const savedCampaigns = pgTable(
  "saved_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueSave: uniqueIndex("saved_campaigns_unique_idx").on(table.userId, table.campaignId),
  })
);

export const savedCreators = pgTable(
  "saved_creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatorProfileId: uuid("creator_profile_id")
      .notNull()
      .references(() => creatorProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueSave: uniqueIndex("saved_creators_unique_idx").on(table.userId, table.creatorProfileId),
  })
);

export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: text("subject_type").notNull(), // creator | brand
  subjectId: uuid("subject_id").notNull(),
  // not_requested | pending | needs_information | approved | rejected | revoked
  status: text("status").notNull().default("pending"),
  reviewerNote: text("reviewer_note"),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterUserId: uuid("reporter_user_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  // open | under_review | resolved | dismissed
  status: text("status").notNull().default("open"),
  resolverId: uuid("resolver_id").references(() => users.id, { onDelete: "set null" }),
  resolutionReason: text("resolution_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

/** High-impact admin action trail — never stores passwords/tokens/secrets, only enough of a
 * before/after snapshot to answer "who changed what, when" during a support/dispute review. */
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    metadata: jsonb("metadata").notNull().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorIdx: index("admin_audit_log_actor_idx").on(table.actorUserId),
    entityIdx: index("admin_audit_log_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("admin_audit_log_created_at_idx").on(table.createdAt),
  })
);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorProfilesRelations = relations(creatorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [creatorProfiles.userId], references: [users.id] }),
  primaryNiche: one(niches, { fields: [creatorProfiles.primaryNicheId], references: [niches.id] }),
  niches: many(creatorNiches),
  socialAccounts: many(creatorSocialAccounts),
  rateCards: many(creatorRateCards),
  portfolioItems: many(creatorPortfolioItems),
  brandExperiences: many(creatorBrandExperiences),
  applications: many(campaignApplications),
}));

export const brandProfilesRelations = relations(brandProfiles, ({ one, many }) => ({
  user: one(users, { fields: [brandProfiles.userId], references: [users.id] }),
  campaigns: many(campaigns),
  socialAccounts: many(brandSocialAccounts),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brandProfiles, { fields: [campaigns.brandProfileId], references: [brandProfiles.id] }),
  category: one(marketplaceCategories, { fields: [campaigns.categoryId], references: [marketplaceCategories.id] }),
  niches: many(campaignNiches),
  platforms: many(campaignPlatforms),
  applications: many(campaignApplications),
  invitations: many(campaignInvitations),
}));

export const campaignApplicationsRelations = relations(campaignApplications, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignApplications.campaignId], references: [campaigns.id] }),
  creator: one(creatorProfiles, { fields: [campaignApplications.creatorProfileId], references: [creatorProfiles.id] }),
}));
