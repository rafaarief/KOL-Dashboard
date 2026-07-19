import { fileURLToPath } from "node:url";
import path from "node:path";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const workerRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const defaultStorageStatePath = path.join(workerRoot, "..", "..", ".auth", "tiktok-storage-state.json");

export const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  aiProvider: process.env.AI_PROVIDER ?? "anthropic",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "claude-sonnet-5",
  maxConcurrency: Number.parseInt(process.env.SCRAPER_MAX_CONCURRENCY ?? "2", 10),
  navigationTimeoutMs: Number.parseInt(process.env.SCRAPER_NAVIGATION_TIMEOUT_MS ?? "30000", 10),
  profileLimit: Number.parseInt(process.env.SCRAPER_PROFILE_LIMIT ?? "30", 10),
  recentVideoLimit: Number.parseInt(process.env.SCRAPER_VIDEO_LIMIT ?? "5", 10),
  defaultMinimumViews: Number.parseInt(process.env.DEFAULT_MINIMUM_VIEWS ?? "10000", 10),
  defaultResultLimit: Number.parseInt(process.env.DEFAULT_RESULT_LIMIT ?? "30", 10),
  healthCheckPort: Number.parseInt(process.env.PORT ?? "8787", 10),
  tiktokStorageStatePath: process.env.TIKTOK_STORAGE_STATE_PATH ?? defaultStorageStatePath,
};
