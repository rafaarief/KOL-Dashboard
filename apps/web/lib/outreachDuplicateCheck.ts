import { type SQL, eq, or } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { getDb, schema } from "@/lib/db";

export interface DuplicateMatch {
  source: "kol_outreach" | "brand_outreach" | "creator_profile" | "brand_profile";
  id: string;
  label: string;
  detail: string;
}

function buildOrConditions(fields: Array<[AnyPgColumn, string | undefined]>): SQL | undefined {
  const conditions = fields
    .filter((entry): entry is [AnyPgColumn, string] => !!entry[1] && entry[1].trim() !== "")
    .map(([column, value]) => eq(column, value.trim()));
  return conditions.length > 0 ? or(...conditions) : undefined;
}

/** Checks for a possible duplicate KOL across in-flight outreach records and already-onboarded
 * creator accounts, matched on email/phone/Instagram/TikTok — per PRD "Duplicate Prevention". */
export async function findKolDuplicates(input: {
  email?: string;
  phone?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  excludeOutreachId?: string;
}): Promise<DuplicateMatch[]> {
  const db = getDb();
  const matches: DuplicateMatch[] = [];

  const outreachWhere = buildOrConditions([
    [schema.kolOutreach.email, input.email],
    [schema.kolOutreach.phone, input.phone],
    [schema.kolOutreach.instagramUrl, input.instagramUrl],
    [schema.kolOutreach.tiktokUrl, input.tiktokUrl],
  ]);
  if (outreachWhere) {
    const rows = await db
      .select({ id: schema.kolOutreach.id, kolName: schema.kolOutreach.kolName, status: schema.kolOutreach.status })
      .from(schema.kolOutreach)
      .where(outreachWhere);
    for (const row of rows) {
      if (input.excludeOutreachId && row.id === input.excludeOutreachId) continue;
      matches.push({
        source: "kol_outreach",
        id: row.id,
        label: row.kolName,
        detail: `Already being tracked in KOL Outreach (status: ${row.status}).`,
      });
    }
  }

  const accountWhere = buildOrConditions([[schema.users.email, input.email]]);
  if (accountWhere) {
    const rows = await db
      .select({ id: schema.creatorProfiles.id, displayName: schema.creatorProfiles.displayName, email: schema.users.email })
      .from(schema.creatorProfiles)
      .innerJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
      .where(accountWhere);
    for (const row of rows) {
      matches.push({
        source: "creator_profile",
        id: row.id,
        label: row.displayName,
        detail: `Already has an OpenCollab account (${row.email}).`,
      });
    }
  }

  return matches;
}

/** Same duplicate check as findKolDuplicates, for brands. */
export async function findBrandDuplicates(input: {
  email?: string;
  phone?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  excludeOutreachId?: string;
}): Promise<DuplicateMatch[]> {
  const db = getDb();
  const matches: DuplicateMatch[] = [];

  const outreachWhere = buildOrConditions([
    [schema.brandOutreach.email, input.email],
    [schema.brandOutreach.phone, input.phone],
    [schema.brandOutreach.instagramUrl, input.instagramUrl],
    [schema.brandOutreach.tiktokUrl, input.tiktokUrl],
  ]);
  if (outreachWhere) {
    const rows = await db
      .select({ id: schema.brandOutreach.id, brandName: schema.brandOutreach.brandName, status: schema.brandOutreach.status })
      .from(schema.brandOutreach)
      .where(outreachWhere);
    for (const row of rows) {
      if (input.excludeOutreachId && row.id === input.excludeOutreachId) continue;
      matches.push({
        source: "brand_outreach",
        id: row.id,
        label: row.brandName,
        detail: `Already being tracked in Brand Outreach (status: ${row.status}).`,
      });
    }
  }

  const accountWhere = buildOrConditions([[schema.users.email, input.email]]);
  if (accountWhere) {
    const rows = await db
      .select({ id: schema.brandProfiles.id, brandName: schema.brandProfiles.brandName, email: schema.users.email })
      .from(schema.brandProfiles)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
      .where(accountWhere);
    for (const row of rows) {
      matches.push({
        source: "brand_profile",
        id: row.id,
        label: row.brandName,
        detail: `Already has an OpenCollab account (${row.email}).`,
      });
    }
  }

  return matches;
}
