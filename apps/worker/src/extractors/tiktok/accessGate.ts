import { ScraperError } from "@kol-finder/shared";

/**
 * These must be narrow, structural signals — NOT loose substrings. A real TikTok page's
 * static JS bundle manifest contains filenames like "captcha-ttp.js" (a lazily-loaded
 * chunk, present on every page whether or not a challenge ever fires) and its i18n
 * dictionary contains the literal string "Log in to TikTok" as a label for an ordinary
 * nav button. Matching on those alone produced false positives on every single page
 * during real testing against tiktok.com — this gate only fires on things that actually
 * indicate a blocked/gated page.
 */
const WAF_CHALLENGE_MARKERS = ["_wafchallengeid", "waforiginalreid"];
const CAPTCHA_CONTAINER_MARKERS = ['id="captcha-verify-container"', 'id="captcha_container"', 'class="captcha_verify_container'];
const LOGIN_MODAL_MARKERS = ['data-e2e="login-modal"', 'id="login-modal"'];

// TikTok's i18n dictionary ships `"This account is private":"<translation>"` as a JSON
// key/value pair on every single page load (search results included), so a loose substring
// match false-positives constantly. Only count it when the phrase is rendered as actual page
// text (`>This account is private<`), which is how a genuinely gated private-profile page
// shows it.
const PRIVATE_ACCOUNT_TEXT_PATTERN = />\s*this account is private\s*</i;

/**
 * Best-effort gate that stops the job rather than trying to work around TikTok's anti-bot
 * measures — per PRD safety rules, we never solve CAPTCHAs or bypass login walls, we just
 * detect them and stop cleanly. `httpStatus` (from the navigation response) is checked
 * first since it's the most reliable signal; text markers are secondary and deliberately
 * narrow to structural attributes rather than any phrase that might appear in a JS bundle
 * manifest or i18n dictionary.
 */
export function assertPageIsAccessible(html: string, httpStatus?: number): void {
  if (httpStatus === 429 || (httpStatus && httpStatus >= 500)) {
    throw new ScraperError("ACCESS_DENIED", `TikTok returned HTTP ${httpStatus}`);
  }
  if (httpStatus === 403) {
    throw new ScraperError("ACCESS_DENIED", "TikTok returned HTTP 403 Forbidden");
  }

  const lowered = html.toLowerCase();

  // TikTok's Bytedance WAF serves a "Please wait..." JS interstitial to requests it
  // doesn't trust. A real browser engine (Playwright/Chromium) clears this automatically
  // in most cases; if it's STILL showing after our normal wait, treat it like a CAPTCHA —
  // it is, functionally, an anti-bot verification step we must not try to defeat.
  const isWafChallenge = WAF_CHALLENGE_MARKERS.some((marker) => lowered.includes(marker)) && lowered.includes("please wait");
  if (isWafChallenge) {
    throw new ScraperError("CAPTCHA_REQUIRED", "TikTok served an anti-bot verification interstitial");
  }

  if (CAPTCHA_CONTAINER_MARKERS.some((marker) => lowered.includes(marker))) {
    throw new ScraperError("CAPTCHA_REQUIRED", "TikTok presented a CAPTCHA challenge");
  }

  if (LOGIN_MODAL_MARKERS.some((marker) => lowered.includes(marker))) {
    throw new ScraperError("LOGIN_REQUIRED", "TikTok requires login to view this page");
  }

  if (PRIVATE_ACCOUNT_TEXT_PATTERN.test(html)) {
    throw new ScraperError("PROFILE_UNAVAILABLE", "This account is private");
  }
}
