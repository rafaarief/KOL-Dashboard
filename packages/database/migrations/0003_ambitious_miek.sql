CREATE TABLE IF NOT EXISTS "kol_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_row_number" integer,
	"month" text,
	"week" text,
	"name" text,
	"platform" text,
	"tier" text,
	"branch" text,
	"visit_date" text,
	"deadline" text,
	"status" text,
	"normalized_status" text,
	"account_link" text,
	"post_link" text,
	"current_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kol_visits_source_row_number_idx" ON "kol_visits" USING btree ("source_row_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_visits_branch_idx" ON "kol_visits" USING btree ("branch");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_visits_tier_idx" ON "kol_visits" USING btree ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_visits_normalized_status_idx" ON "kol_visits" USING btree ("normalized_status");