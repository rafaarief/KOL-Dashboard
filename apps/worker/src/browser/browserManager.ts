import { existsSync } from "node:fs";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { config } from "../config.js";
import { logger } from "../logger.js";

/**
 * Owns a single shared Chromium instance for this worker process and hands out
 * short-lived contexts. Keeps concurrency conservative per PRD section 18.3 —
 * start small (1 browser, a couple of contexts) and tune after real-world testing.
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private activeContexts = 0;

  async launch(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    logger.info(
      { event: "browser_launched", authenticatedSession: existsSync(config.tiktokStorageStatePath) },
      "Chromium launched"
    );
  }

  async withContext<T>(fn: (context: BrowserContext) => Promise<T>): Promise<T> {
    if (!this.browser) await this.launch();
    if (!this.browser) throw new Error("Browser failed to launch");

    while (this.activeContexts >= config.maxConcurrency) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    this.activeContexts += 1;
    const hasStoredSession = existsSync(config.tiktokStorageStatePath);
    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 900 },
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
      storageState: hasStoredSession ? config.tiktokStorageStatePath : undefined,
    });
    context.setDefaultNavigationTimeout(config.navigationTimeoutMs);

    try {
      return await fn(context);
    } finally {
      await context.close();
      this.activeContexts -= 1;
    }
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info({ event: "browser_closed" }, "Chromium closed");
    }
  }
}

export const browserManager = new BrowserManager();
