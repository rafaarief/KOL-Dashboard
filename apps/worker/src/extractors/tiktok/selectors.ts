/**
 * DOM fallback selectors, used only when the embedded rehydration JSON (rehydrationData.ts)
 * is missing or unparseable. Centralized here per PRD section 10.6 — selectors must not be
 * spread across the application. TikTok changes these often; expect to update this file
 * before the JSON-based path, which is why it's the fallback, not the primary path.
 */
export const SEARCH_RESULT_CARD = '[data-e2e="search_video-item"], [data-e2e="search-card-video"]';
export const SEARCH_RESULT_LINK = "a";
export const SEARCH_RESULT_CAPTION = '[data-e2e="search-card-desc"]';
export const SEARCH_RESULT_VIEW_COUNT = '[data-e2e="video-views"], strong[data-e2e="video-views"]';

export const PROFILE_DISPLAY_NAME = '[data-e2e="user-subtitle"]';
export const PROFILE_BIO = '[data-e2e="user-bio"]';
export const PROFILE_FOLLOWER_COUNT = '[data-e2e="followers-count"]';
export const PROFILE_FOLLOWING_COUNT = '[data-e2e="following-count"]';
export const PROFILE_LIKE_COUNT = '[data-e2e="likes-count"]';
export const PROFILE_VIDEO_GRID_ITEM = '[data-e2e="user-post-item"]';

export const CAPTCHA_CONTAINER = "#captcha-verify-container, .captcha_verify_container";
