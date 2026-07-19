import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let cachedClient: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (cachedClient) return cachedClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const queryClient = postgres(connectionString);
  cachedClient = drizzle(queryClient, { schema });
  return cachedClient;
}

export type Database = ReturnType<typeof getDb>;
export * as schema from "./schema.js";
