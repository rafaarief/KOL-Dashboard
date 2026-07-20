ALTER TABLE "creator_profiles" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "years_of_experience" integer;