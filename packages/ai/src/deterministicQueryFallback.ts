import { parsedQuerySchema, type ParsedQuery } from "@kol-finder/schemas";
import { NICHE_KEYWORD_HINTS, normalizeTikTokNumber, type Niche } from "@kol-finder/shared";
import { aiConfig } from "./config.js";

const KNOWN_LOCATIONS = [
  "blok m",
  "jakarta selatan",
  "jakarta utara",
  "jakarta barat",
  "jakarta timur",
  "jakarta pusat",
  "jakarta",
  "bandung",
  "jogja",
  "yogyakarta",
  "surabaya",
  "tangerang",
  "bekasi",
  "depok",
  "bali",
  "medan",
  "semarang",
];

function extractLocation(query: string): string | null {
  const lowered = query.toLowerCase();
  const match = KNOWN_LOCATIONS.find((location) => lowered.includes(location));
  return match ? match.replace(/\b\w/g, (char) => char.toUpperCase()) : null;
}

function extractNicheHints(query: string): string[] {
  const lowered = query.toLowerCase();
  const hints: Niche[] = [];

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORD_HINTS) as Array<[Niche, string[]]>) {
    if (keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      hints.push(niche);
    }
  }

  return hints;
}

function extractMinimumViews(query: string): number | null {
  const match = query.match(/minimal\s+([\d.,]+)\s*(ribu|rb|k|juta|jt)?\s*(?:views?|penonton)/i);
  if (!match) return null;

  const [, amount, suffix] = match;
  const normalized = normalizeTikTokNumber(suffix ? `${amount}${suffix}` : amount);
  return normalized.normalized;
}

function extractTimeRangeDays(query: string): number | null {
  const match = query.match(/(\d+)\s*(hari|day)/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Deterministic template used when no AI provider key is configured, or the AI call fails
 * (PRD section 30 — AI must never be the only path; deterministic fallback keeps the
 * pipeline usable). Intentionally conservative: single direct keyword, best-effort hints.
 */
export function interpretQueryDeterministically(rawQuery: string): ParsedQuery {
  const trimmed = rawQuery.trim();

  return parsedQuerySchema.parse({
    primaryKeyword: trimmed,
    keywordVariations: [trimmed],
    category: null,
    location: extractLocation(trimmed),
    nicheHints: extractNicheHints(trimmed),
    timeRangeDays: extractTimeRangeDays(trimmed),
    minimumViews: extractMinimumViews(trimmed) ?? aiConfig.defaultMinimumViews,
    minimumFollowers: null,
    maximumFollowers: null,
    creatorType: null,
    maximumCreators: aiConfig.defaultResultLimit,
    recentVideoLimit: aiConfig.recentVideoLimit,
    sortMode: "balanced",
  });
}
