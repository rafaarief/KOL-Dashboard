CREATE TABLE IF NOT EXISTS "brand_outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pic_user_id" uuid NOT NULL,
	"brand_name" text NOT NULL,
	"industry" text,
	"email" text,
	"phone" text,
	"instagram_url" text,
	"instagram_followers" integer,
	"tiktok_url" text,
	"tiktok_followers" integer,
	"website" text,
	"source" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"last_follow_up_at" timestamp with time zone,
	"status_changed_at" timestamp with time zone,
	"converted_brand_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_outreach_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_outreach_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kol_outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pic_user_id" uuid NOT NULL,
	"kol_name" text NOT NULL,
	"email" text,
	"phone" text,
	"instagram_url" text,
	"instagram_followers" integer,
	"tiktok_url" text,
	"tiktok_followers" integer,
	"primary_niche_id" uuid,
	"city" text,
	"source" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"last_follow_up_at" timestamp with time zone,
	"status_changed_at" timestamp with time zone,
	"converted_creator_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kol_outreach_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kol_outreach_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "pic_name" text;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "pic_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manual_onboarding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manual_onboarded_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manual_onboarded_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_outreach" ADD CONSTRAINT "brand_outreach_pic_user_id_users_id_fk" FOREIGN KEY ("pic_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_outreach" ADD CONSTRAINT "brand_outreach_converted_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("converted_brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_outreach_events" ADD CONSTRAINT "brand_outreach_events_brand_outreach_id_brand_outreach_id_fk" FOREIGN KEY ("brand_outreach_id") REFERENCES "public"."brand_outreach"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_outreach_events" ADD CONSTRAINT "brand_outreach_events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kol_outreach" ADD CONSTRAINT "kol_outreach_pic_user_id_users_id_fk" FOREIGN KEY ("pic_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kol_outreach" ADD CONSTRAINT "kol_outreach_primary_niche_id_niches_id_fk" FOREIGN KEY ("primary_niche_id") REFERENCES "public"."niches"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kol_outreach" ADD CONSTRAINT "kol_outreach_converted_creator_profile_id_creator_profiles_id_fk" FOREIGN KEY ("converted_creator_profile_id") REFERENCES "public"."creator_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kol_outreach_events" ADD CONSTRAINT "kol_outreach_events_kol_outreach_id_kol_outreach_id_fk" FOREIGN KEY ("kol_outreach_id") REFERENCES "public"."kol_outreach"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kol_outreach_events" ADD CONSTRAINT "kol_outreach_events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_outreach_pic_idx" ON "brand_outreach" USING btree ("pic_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_outreach_status_idx" ON "brand_outreach" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_outreach_created_at_idx" ON "brand_outreach" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_outreach_events_outreach_idx" ON "brand_outreach_events" USING btree ("brand_outreach_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_outreach_pic_idx" ON "kol_outreach" USING btree ("pic_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_outreach_status_idx" ON "kol_outreach" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_outreach_created_at_idx" ON "kol_outreach" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_outreach_events_outreach_idx" ON "kol_outreach_events" USING btree ("kol_outreach_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_manual_onboarded_by_users_id_fk" FOREIGN KEY ("manual_onboarded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
