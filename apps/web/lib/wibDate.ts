const JAKARTA_OFFSET = "+07:00";

/** A brand types "2026-08-15" into a plain `<input type="date">`, which yields a bare
 * "YYYY-MM-DD" string with no timezone. `new Date("YYYY-MM-DD")` parses that as UTC midnight —
 * 07:00 WIB, seven hours into the Jakarta-local day the brand actually meant. These interpret
 * the typed date in Asia/Jakarta (WIB, UTC+7, no DST) instead, matching what "starts this day" /
 * "deadline is this day" intuitively mean for a Jakarta-based marketplace. */
export function parseWibStartOfDay(value: string): Date {
  return new Date(`${value}T00:00:00${JAKARTA_OFFSET}`);
}

export function parseWibEndOfDay(value: string): Date {
  return new Date(`${value}T23:59:59${JAKARTA_OFFSET}`);
}
