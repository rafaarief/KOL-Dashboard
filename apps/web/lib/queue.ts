import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAMES } from "@kol-finder/schemas";

let connection: Redis | null = null;
let tiktokSearchQueue: Queue | null = null;
let creatorRefreshQueue: Queue | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getTikTokSearchQueue(): Queue {
  if (!tiktokSearchQueue) {
    tiktokSearchQueue = new Queue(QUEUE_NAMES.tiktokSearch, { connection: getConnection() });
  }
  return tiktokSearchQueue;
}

export function getCreatorRefreshQueue(): Queue {
  if (!creatorRefreshQueue) {
    creatorRefreshQueue = new Queue(QUEUE_NAMES.creatorRefresh, { connection: getConnection() });
  }
  return creatorRefreshQueue;
}
