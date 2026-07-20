CREATE INDEX IF NOT EXISTS "brand_profiles_status_idx" ON "brand_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_applications_status_idx" ON "campaign_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_profiles_status_idx" ON "creator_profiles" USING btree ("status");