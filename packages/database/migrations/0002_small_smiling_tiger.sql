CREATE TABLE IF NOT EXISTS "nano_kols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_row_number" integer,
	"full_name" text,
	"age" text,
	"gender" text,
	"normalized_gender" text,
	"domisili" text,
	"tiktok_username" text,
	"tiktok_url" text,
	"tiktok_followers_raw" text,
	"tiktok_followers_count" bigint,
	"niche_tiktok_raw" text,
	"er_tiktok_raw" text,
	"avg_views_tiktok_raw" text,
	"instagram_username" text,
	"instagram_url" text,
	"instagram_followers_raw" text,
	"instagram_followers_count" bigint,
	"niche_instagram_raw" text,
	"er_instagram_raw" text,
	"avg_views_instagram_raw" text,
	"content_review_link" text,
	"phone_number" text,
	"note" text,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nano_kols_source_row_number_idx" ON "nano_kols" USING btree ("source_row_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nano_kols_domisili_idx" ON "nano_kols" USING btree ("domisili");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nano_kols_normalized_gender_idx" ON "nano_kols" USING btree ("normalized_gender");