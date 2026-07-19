import { Worker } from "bullmq";
import { QUEUE_NAMES, creatorRefreshJobSchema } from "@kol-finder/schemas";
import { createRedisConnection } from "../queue/connection.js";
import { runCreatorRefreshJob } from "../jobs/refreshCreatorJob.js";
import { logger } from "../logger.js";

export function createCreatorRefreshWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.creatorRefresh,
    async (job) => {
      const payload = creatorRefreshJobSchema.parse(job.data);
      await runCreatorRefreshJob(payload);
    },
    { connection: createRedisConnection(), concurrency: 1 }
  );

  worker.on("failed", (job, error) => {
    logger.error({ event: "creator_refresh_failed", jobId: job?.id, error: String(error) }, "Creator refresh failed");
  });

  return worker;
}
