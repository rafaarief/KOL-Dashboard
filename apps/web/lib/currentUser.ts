import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const DEFAULT_USER_EMAIL = "internal@kolfinder.local";

/** No login system — every write attributes to this single internal user. */
export async function getDefaultUserId(): Promise<string> {
  return getOrCreateUserId(DEFAULT_USER_EMAIL);
}

export async function getOrCreateUserId(email: string): Promise<string> {
  const db = getDb();

  // No lastLoginAt write on the fast path — this is a single shared "system" account for every
  // KOL Finder search/shortlist/save action, so stamping a write on every read-adjacent call was
  // an unnecessary extra round trip on a hot path that doesn't need per-action last-login tracking.
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return existing.id;

  // onConflictDoNothing + fallback select: two concurrent first-ever requests (e.g. two people
  // submitting a search simultaneously right after a fresh DB) could otherwise both see
  // `existing === undefined` and both try to INSERT the same email — whichever lost the unique-
  // constraint race would 500 instead of just using the winner's row.
  const [created] = await db
    .insert(schema.users)
    .values({ email, lastLoginAt: new Date() })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id });
  if (created) return created.id;

  const [winner] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!winner) throw new Error(`getOrCreateUserId: insert conflicted but no row found for ${email}`);
  return winner.id;
}
