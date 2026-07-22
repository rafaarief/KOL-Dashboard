CREATE INDEX IF NOT EXISTS "brand_profiles_verification_status_idx" ON "brand_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_profiles_city_idx" ON "brand_profiles" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_crm_status_idx" ON "businesses" USING btree ("crm_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_rating_idx" ON "businesses" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "businesses_lead_score_idx" ON "businesses" USING btree ("lead_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_city_idx" ON "campaigns" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_application_deadline_idx" ON "campaigns" USING btree ("application_deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_featured_published_idx" ON "campaigns" USING btree ("featured","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_metric_snapshots_creator_id_idx" ON "creator_metric_snapshots" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_profiles_verification_status_idx" ON "creator_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_profiles_city_idx" ON "creator_profiles" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_profiles_minimum_budget_idx" ON "creator_profiles" USING btree ("minimum_budget");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_target_type_target_id_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scraping_events_search_id_idx" ON "scraping_events" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_keywords_search_id_idx" ON "search_keywords" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_results_search_id_idx" ON "search_results" USING btree ("search_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "search_results_search_id_creator_id_unique" ON "search_results" USING btree ("search_id","creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shortlist_creators_shortlist_id_idx" ON "shortlist_creators" USING btree ("shortlist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_requests_status_idx" ON "verification_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_requests_created_at_idx" ON "verification_requests" USING btree ("created_at");