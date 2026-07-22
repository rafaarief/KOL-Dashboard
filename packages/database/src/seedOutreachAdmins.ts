import bcryptjs from "bcryptjs";
const { hash } = bcryptjs;
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/** Seeds the two named outreach_admin accounts from the Outreach Operations Dashboard PRD
 * (Annisa, Naila). Idempotent: re-running does not duplicate or reset an existing account's
 * password — it only creates rows that don't yet exist by email. Never hardcodes a plaintext
 * password; see requireSeedOutreachPassword() below. */

function requireSeedOutreachPassword(): string {
  const value = process.env.SEED_OUTREACH_PASSWORD;
  if (!value) {
    throw new Error(
      "SEED_OUTREACH_PASSWORD is not set. This seed script creates real login credentials for " +
        "annisa@opencollab.id / naila@opencollab.id, so it refuses to fall back to a hardcoded " +
        "default — set SEED_OUTREACH_PASSWORD in your shell before running it."
    );
  }
  return value;
}

const OUTREACH_ADMINS = [
  { email: "annisa@opencollab.id", fullName: "Annisa" },
  { email: "naila@opencollab.id", fullName: "Naila" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  const passwordHash = await hash(requireSeedOutreachPassword(), 10);

  let created = 0;
  for (const account of OUTREACH_ADMINS) {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, account.email)).limit(1);
    if (existing) continue;
    await db.insert(schema.users).values({ ...account, role: "outreach_admin", passwordHash });
    created += 1;
  }

  console.log(`Outreach admin seed: ${created} account(s) created, ${OUTREACH_ADMINS.length - created} already existed.`);
  console.log("Accounts: annisa@opencollab.id, naila@opencollab.id (password set via SEED_OUTREACH_PASSWORD env var).");
  await client.end();
}

main().catch((error) => {
  console.error("Outreach admin seed failed:", error);
  process.exit(1);
});
