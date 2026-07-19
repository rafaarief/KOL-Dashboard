import { createServer } from "node:http";
import { createTikTokSearchWorker } from "./workers/tiktokSearchWorker.js";
import { createCreatorRefreshWorker } from "./workers/creatorRefreshWorker.js";
import { browserManager } from "./browser/browserManager.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

async function main() {
  await browserManager.launch();

  const searchWorker = createTikTokSearchWorker();
  const refreshWorker = createCreatorRefreshWorker();

  const healthServer = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  healthServer.listen(config.healthCheckPort, () => {
    logger.info({ event: "worker_started", port: config.healthCheckPort }, "KOL Finder worker started");
  });

  async function shutdown() {
    logger.info({ event: "worker_shutting_down" }, "Shutting down worker");
    await Promise.all([searchWorker.close(), refreshWorker.close()]);
    await browserManager.shutdown();
    healthServer.close();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ event: "worker_fatal_error", error: String(error) }, "Worker failed to start");
  process.exit(1);
});
