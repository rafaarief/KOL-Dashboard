/** postgres-js surfaces Postgres error-response fields as plain properties on the thrown error
 * (code 23505 = unique_violation; constraint_name identifies which constraint). Used to turn a
 * raced unique-constraint violation into a clean JSON error instead of a generic 500 — the
 * authoritative guard against a TOCTOU race between a pre-check SELECT and the later INSERT,
 * which no amount of pre-checking can fully close on its own. */
export function isUniqueViolation(error: unknown, constraintName?: string): boolean {
  const pgError = error as { code?: string; constraint_name?: string };
  if (pgError?.code !== "23505") return false;
  return !constraintName || pgError.constraint_name === constraintName;
}

/** Thrown inside a db.transaction callback when an outreach record is already converted, so the
 * transaction rolls back cleanly and the route handler can map it to a 409 instead of silently
 * creating a second account. */
export class AlreadyConvertedError extends Error {
  constructor() {
    super("This outreach record has already been converted.");
    this.name = "AlreadyConvertedError";
  }
}
