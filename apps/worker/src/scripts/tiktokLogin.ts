import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { config } from "../config.js";
import { logger } from "../logger.js";

const AUTH_COOKIE_NAMES = ["sessionid", "sid_tt"];
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * One-time interactive setup: opens a real (headed) Chromium window, lets a human log into
 * TikTok normally, then saves the resulting cookies/storage state to disk so the worker's
 * headless scraper can reuse an authenticated session instead of anonymous requests (which
 * TikTok's bot detection increasingly blocks — see accessGate.ts). Re-run this whenever the
 * saved session expires or gets logged out.
 */
async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  });
  const page = await context.newPage();
  await page.goto("https://www.tiktok.com/login");

  console.log("A browser window has opened. Log into TikTok there, then leave it — this will detect login automatically.");

  const deadline = Date.now() + TIMEOUT_MS;
  let loggedIn = false;

  while (Date.now() < deadline) {
    const cookies = await context.cookies();
    loggedIn = cookies.some((cookie) => AUTH_COOKIE_NAMES.includes(cookie.name));
    if (loggedIn) break;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  if (!loggedIn) {
    console.error(`No login detected within ${TIMEOUT_MS / 60000} minutes. Closing without saving.`);
    await browser.close();
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(config.tiktokStorageStatePath), { recursive: true });
  await context.storageState({ path: config.tiktokStorageStatePath });

  logger.info({ event: "tiktok_session_saved", path: config.tiktokStorageStatePath }, "TikTok session saved");
  console.log(`Login detected. Session saved to ${config.tiktokStorageStatePath}`);

  await browser.close();
}

main();
