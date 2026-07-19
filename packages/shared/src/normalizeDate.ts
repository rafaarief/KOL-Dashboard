export interface NormalizedDate {
  publishedAt: string | null;
  sourceFormat: string;
  isEstimated: boolean;
  confidence: number;
}

const RELATIVE_PATTERN = /^(\d+)\s*(s|sec|second|detik|m|min|minute|menit|h|hr|hour|jam|d|day|hari|w|week|minggu|mo|month|bulan|y|yr|year|tahun)s?\s*(ago|yang lalu|lalu)?$/i;

const UNIT_TO_MS: Record<string, number> = {
  s: 1_000,
  sec: 1_000,
  second: 1_000,
  detik: 1_000,
  m: 60_000,
  min: 60_000,
  minute: 60_000,
  menit: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hour: 3_600_000,
  jam: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  hari: 86_400_000,
  w: 604_800_000,
  week: 604_800_000,
  minggu: 604_800_000,
  mo: 2_592_000_000,
  month: 2_592_000_000,
  bulan: 2_592_000_000,
  y: 31_536_000_000,
  yr: 31_536_000_000,
  year: 31_536_000_000,
  tahun: 31_536_000_000,
};

/**
 * Normalizes TikTok-visible upload dates ("2d ago", "3h ago", "17-7-2026", ISO timestamps
 * embedded in page data) into an absolute UTC ISO string. `now` is injected by the caller
 * so this stays deterministic and testable.
 */
export function normalizeTikTokDate(rawInput: string | null | undefined, now: Date): NormalizedDate {
  const raw = (rawInput ?? "").trim();

  if (!raw) {
    return { publishedAt: null, sourceFormat: raw, isEstimated: false, confidence: 0 };
  }

  const isoAttempt = new Date(raw);
  if (!Number.isNaN(isoAttempt.getTime()) && /\d{4}-\d{2}-\d{2}/.test(raw)) {
    return { publishedAt: isoAttempt.toISOString(), sourceFormat: raw, isEstimated: false, confidence: 1 };
  }

  const relativeMatch = raw.match(RELATIVE_PATTERN);
  if (relativeMatch) {
    const [, amountText, unitText] = relativeMatch;
    const amount = Number.parseInt(amountText, 10);
    const unitMs = UNIT_TO_MS[unitText.toLowerCase()];
    if (unitMs) {
      const publishedAt = new Date(now.getTime() - amount * unitMs);
      return {
        publishedAt: publishedAt.toISOString(),
        sourceFormat: raw,
        isEstimated: true,
        confidence: 0.85,
      };
    }
  }

  // TikTok often shows bare "MM-DD" for videos uploaded within the current year.
  const shortDateMatch = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  if (shortDateMatch) {
    const [, monthText, dayText] = shortDateMatch;
    const year = now.getUTCFullYear();
    const candidate = new Date(Date.UTC(year, Number.parseInt(monthText, 10) - 1, Number.parseInt(dayText, 10)));
    return { publishedAt: candidate.toISOString(), sourceFormat: raw, isEstimated: true, confidence: 0.6 };
  }

  return { publishedAt: null, sourceFormat: raw, isEstimated: false, confidence: 0 };
}

export function daysSince(publishedAt: string | null, now: Date): number | null {
  if (!publishedAt) return null;
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return null;
  const diffMs = now.getTime() - published.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}
