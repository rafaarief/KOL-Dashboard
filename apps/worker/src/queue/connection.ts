import { Redis } from "ioredis";
import { config } from "../config.js";

export function createRedisConnection(): Redis {
  return new Redis(config.redisUrl, { maxRetriesPerRequest: null });
}
