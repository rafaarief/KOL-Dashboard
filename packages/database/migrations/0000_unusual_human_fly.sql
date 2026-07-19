CREATE TABLE IF NOT EXISTS "creator_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"follower_count" bigint,
	"total_like_count" bigint,
	"recent_average_views" bigint,
	"recent_median_views" bigint,
	"recent_max_views" bigint,
	"recent_min_views" bigint,
	"recent_over_10k_count" integer DEFAULT 0 NOT NULL,
	"last_upload_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text DEFAULT 'tiktok' NOT NULL,
	"platform_creator_id" text,
	"username" text NOT NULL,
	"normalized_username" text NOT NULL,
	"display_name" text,
	"profile_url" text NOT NULL,
	"bio" text,
	"profile_image_url" text,
	"follower_count" bigint,
	"following_count" bigint,
	"total_like_count" bigint,
	"is_verified" boolean,
	"public_contact_text" text,
	"public_external_link" text,
	"primary_niche" text,
	"secondary_niches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"niche_confidence" numeric(4, 3),
	"niche_reason" text,
	"inferred_location" text,
	"location_confidence" numeric(4, 3),
	"first_discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scraping_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid,
	"creator_id" uuid,
	"job_id" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"keyword_type" text DEFAULT 'direct' NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"primary_video_id" uuid,
	"discovery_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"freshness_score" numeric(5, 2) NOT NULL,
	"relevant_video_score" numeric(5, 2) NOT NULL,
	"recent_performance_score" numeric(5, 2) NOT NULL,
	"view_performance_score" numeric(5, 2) NOT NULL,
	"keyword_relevance_score" numeric(5, 2) NOT NULL,
	"final_score" numeric(5, 2) NOT NULL,
	"ranking_label" text NOT NULL,
	"ranking_explanation" text NOT NULL,
	"rank_position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"original_query" text NOT NULL,
	"parsed_query" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"progress_step" text,
	"candidate_video_count" integer DEFAULT 0 NOT NULL,
	"qualifying_video_count" integer DEFAULT 0 NOT NULL,
	"creator_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shortlist_creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shortlist_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"search_result_id" uuid,
	"status" text DEFAULT 'Discovered' NOT NULL,
	"internal_notes" text,
	"proposed_deliverable" text,
	"proposed_price" numeric(12, 2),
	"final_price" numeric(12, 2),
	"added_by" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shortlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client_name" text,
	"campaign_name" text,
	"campaign_brief" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'specialist' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"platform_video_id" text,
	"video_url" text NOT NULL,
	"caption" text,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"thumbnail_url" text,
	"published_at" timestamp with time zone,
	"published_at_estimated" boolean DEFAULT false NOT NULL,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"share_count" bigint,
	"discovery_keyword" text,
	"is_recent_video_snapshot" boolean DEFAULT false NOT NULL,
	"extraction_confidence" numeric(4, 3) NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_metric_snapshots" ADD CONSTRAINT "creator_metric_snapshots_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scraping_events" ADD CONSTRAINT "scraping_events_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scraping_events" ADD CONSTRAINT "scraping_events_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_keywords" ADD CONSTRAINT "search_keywords_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_results" ADD CONSTRAINT "search_results_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_results" ADD CONSTRAINT "search_results_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_results" ADD CONSTRAINT "search_results_primary_video_id_videos_id_fk" FOREIGN KEY ("primary_video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortlist_creators" ADD CONSTRAINT "shortlist_creators_shortlist_id_shortlists_id_fk" FOREIGN KEY ("shortlist_id") REFERENCES "public"."shortlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortlist_creators" ADD CONSTRAINT "shortlist_creators_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortlist_creators" ADD CONSTRAINT "shortlist_creators_search_result_id_search_results_id_fk" FOREIGN KEY ("search_result_id") REFERENCES "public"."search_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "creators_platform_normalized_username_idx" ON "creators" USING btree ("platform","normalized_username");