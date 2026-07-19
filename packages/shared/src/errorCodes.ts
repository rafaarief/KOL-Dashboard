export const ERROR_CODES = [
  "SEARCH_PAGE_UNAVAILABLE",
  "SEARCH_RESULTS_NOT_FOUND",
  "PROFILE_UNAVAILABLE",
  "VIDEO_UNAVAILABLE",
  "VIEW_COUNT_NOT_FOUND",
  "DATE_NOT_FOUND",
  "SELECTOR_VERSION_MISMATCH",
  "NAVIGATION_TIMEOUT",
  "ACCESS_DENIED",
  "CAPTCHA_REQUIRED",
  "LOGIN_REQUIRED",
  "BROWSER_CRASH",
  "DATABASE_WRITE_FAILED",
  "QUEUE_CONNECTION_FAILED",
  "AI_CLASSIFICATION_FAILED",
  "INVALID_AI_OUTPUT",
  "JOB_CANCELLED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Error codes that must immediately stop the job rather than retry — see directives/handle_scraping_failure.md. */
export const TERMINAL_ERROR_CODES: ErrorCode[] = ["ACCESS_DENIED", "CAPTCHA_REQUIRED", "LOGIN_REQUIRED", "JOB_CANCELLED"];

export class ScraperError extends Error {
  code: ErrorCode;
  metadata?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = "ScraperError";
    this.code = code;
    this.metadata = metadata;
  }

  get isTerminal(): boolean {
    return TERMINAL_ERROR_CODES.includes(this.code);
  }
}
