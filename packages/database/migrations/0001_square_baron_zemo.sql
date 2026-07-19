CREATE TABLE IF NOT EXISTS "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"category_id" uuid,
	"phone" text,
	"phone_type" text,
	"is_whatsapp_candidate" boolean DEFAULT false NOT NULL,
	"website" text,
	"instagram" text,
	"facebook" text,
	"email" text,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"status" text,
	"address" text,
	"district" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"lead_score" integer DEFAULT 0 NOT NULL,
	"crm_status" text DEFAULT 'New' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_category_name_unique" UNIQUE("category_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_category_id_idx" ON "businesses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_city_idx" ON "businesses" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_province_idx" ON "businesses" USING btree ("province");