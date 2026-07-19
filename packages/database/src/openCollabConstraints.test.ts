import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** These constraints are the actual enforcement mechanism behind several MVP business rules
 * (one application per creator per campaign, one saved campaign/creator per user, unique
 * creator usernames and brand/campaign slugs). Rather than re-deriving them by hitting a real
 * database, this asserts they exist in the migration that was generated from schema.ts and
 * already applied to Neon — see packages/database/migrations/0004_daily_mantis.sql. */

const migrationsDir = join(__dirname, "..", "migrations");
const migrationSql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n");

describe("OpenCollab schema constraints (applied migration SQL)", () => {
  it("enforces one application per creator per campaign", () => {
    expect(migrationSql).toMatch(/UNIQUE INDEX.*campaign_applications_unique_idx.*campaign_id.*creator_profile_id/is);
  });

  it("enforces one saved campaign per user per campaign", () => {
    expect(migrationSql).toMatch(/UNIQUE INDEX.*saved_campaigns_unique_idx.*user_id.*campaign_id/is);
  });

  it("enforces one saved creator per brand user per creator", () => {
    expect(migrationSql).toMatch(/UNIQUE INDEX.*saved_creators_unique_idx.*user_id.*creator_profile_id/is);
  });

  it("enforces one invitation per creator per campaign", () => {
    expect(migrationSql).toMatch(/UNIQUE INDEX.*campaign_invitations_unique_idx.*campaign_id.*creator_profile_id/is);
  });

  it("enforces unique creator usernames, brand slugs, and campaign slugs", () => {
    expect(migrationSql).toContain('CONSTRAINT "creator_profiles_username_unique" UNIQUE("username")');
    expect(migrationSql).toContain('CONSTRAINT "brand_profiles_slug_unique" UNIQUE("slug")');
    expect(migrationSql).toContain('CONSTRAINT "campaigns_slug_unique" UNIQUE("slug")');
  });

  it("preserves the pre-existing KOL Finder unique constraints untouched", () => {
    expect(migrationSql).toContain('CONSTRAINT "users_email_unique" UNIQUE("email")');
  });
});
