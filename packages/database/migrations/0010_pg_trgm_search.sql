-- Hand-written (not drizzle-kit generated): expression GIN indexes with a custom opclass aren't
-- expressible in drizzle's declarative pgTable index builder for this version. Must stay in sync
-- with the search expressions in apps/web/app/api/admin/outreach/kols/route.ts (KOL_SEARCH_BLOB)
-- and brands/route.ts (BRAND_SEARCH_BLOB) — the ILIKE query and the indexed expression have to be
-- textually identical for Postgres to use these indexes instead of a sequential scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kol_outreach_search_trgm_idx" ON "kol_outreach" USING gin (
  (coalesce("kol_name", '') || ' ' || coalesce("email", '') || ' ' || coalesce("phone", '') || ' ' || coalesce("instagram_url", '') || ' ' || coalesce("tiktok_url", '') || ' ' || coalesce("city", '')) gin_trgm_ops
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_outreach_search_trgm_idx" ON "brand_outreach" USING gin (
  (coalesce("brand_name", '') || ' ' || coalesce("email", '') || ' ' || coalesce("phone", '') || ' ' || coalesce("instagram_url", '') || ' ' || coalesce("tiktok_url", '') || ' ' || coalesce("website", '')) gin_trgm_ops
);
