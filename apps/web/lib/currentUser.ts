import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

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
