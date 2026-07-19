import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const DEFAULT_USER_EMAIL = "internal@kolfinder.local";

/** No login system — every write attributes to this single internal user. */
export async function getDefaultUserId(): Promise<string> {
  return getOrCreateUserId(DEFAULT_USER_EMAIL);
}

export async function getOrCreateUserId(email: string): Promise<string> {
  const db = getDb();

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, existing.id));
    return existing.id;
  }

  const [created] = await db.insert(schema.users).values({ email, lastLoginAt: new Date() }).returning({ id: schema.users.id });
  return created.id;
}
