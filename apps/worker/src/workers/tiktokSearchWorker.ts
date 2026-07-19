import { Worker } from "bullmq";
import { QUEUE_NAMES, tiktokSearchJobSchema } from "@kol-finder/schemas";
import { createRedisConnection } from "../queue/connection.js";
import { runSearchJob } from "../jobs/searchJob.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

export function createTikTokSearchWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.tiktokSearch,
    async (job) => {
      const payload = tiktokSearchJobSchema.parse(job.data);
      logger.info({ event: "job_started", searchId: payload.searchId, jobId: job.id }, "Search job started");
      await runSearchJob(payload);
    },
    {
      connection: createRedisConnection(),
      concurrency: config.maxConcurrency,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ event: "job_completed", jobId: job.id }, "Search job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ event: "job_failed", jobId: job?.id, error: String(error) }, "Search job failed");
  });

  return worker;
}
