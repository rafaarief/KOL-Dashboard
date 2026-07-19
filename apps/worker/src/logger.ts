import pino from "pino";

/** Structured logging only — never log cookies, session tokens, or secrets (PRD section 25). */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["*.cookies", "*.headers.authorization", "*.headers.cookie"],
});
