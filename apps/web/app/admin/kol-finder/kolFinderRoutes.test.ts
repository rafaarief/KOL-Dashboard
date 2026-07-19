import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Confirms the existing KOL Finder product wasn't deleted during the move into /admin —
 * only relocated. See the git history around the OpenCollab.id migration for the `git mv`s. */

const adminDir = join(__dirname, "..");

describe("KOL Finder pages survive the move into /admin/kol-finder", () => {
  it.each([
    "kol-finder/page.tsx",
    "kol-finder/search/page.tsx",
    "kol-finder/search/[searchId]/page.tsx",
    "kol-finder/database/page.tsx",
    "kol-finder/history/page.tsx",
    "kol-finder/shortlists/page.tsx",
    "kol-finder/shortlists/[shortlistId]/page.tsx",
    "kol-finder/nano-kols/page.tsx",
    "business-leads/page.tsx",
  ])("admin/%s exists", (relativePath) => {
    expect(existsSync(join(adminDir, relativePath))).toBe(true);
  });
});
