export interface NormalizedNumber {
  raw: string;
  normalized: number | null;
  confidence: number;
}

const SUFFIX_MULTIPLIERS: Array<{ pattern: RegExp; multiplier: number }> = [
  { pattern: /^(ribu)$/i, multiplier: 1_000 },
  { pattern: /^(rb)$/i, multiplier: 1_000 },
  { pattern: /^(k)$/i, multiplier: 1_000 },
  { pattern: /^(jt|juta)$/i, multiplier: 1_000_000 },
  { pattern: /^(m)$/i, multiplier: 1_000_000 },
  { pattern: /^(miliar|milyar|b)$/i, multiplier: 1_000_000_000 },
];

/**
 * Normalizes TikTok-style visible counts ("1.2K", "12K", "1.3M", "2,4 jt", "10 ribu", "999")
 * into an integer. Returns null with confidence 0 when the raw text cannot be parsed —
 * callers must not treat that as zero.
 */
export function normalizeTikTokNumber(rawInput: string | null | undefined): NormalizedNumber {
  const raw = (rawInput ?? "").trim();

  if (!raw) {
    return { raw, normalized: null, confidence: 0 };
  }

  const cleaned = raw.replace(/\s+/g, " ").trim();

  const match = cleaned.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
  if (!match) {
    return { raw, normalized: null, confidence: 0 };
  }

  const [, numericPart, suffixRaw] = match;
  const suffix = suffixRaw?.toLowerCase();

  const numericValue = parseLocalizedDecimal(numericPart);
  if (numericValue === null) {
    return { raw, normalized: null, confidence: 0 };
  }

  if (!suffix) {
    return { raw, normalized: Math.round(numericValue), confidence: 1 };
  }

  const suffixMatch = SUFFIX_MULTIPLIERS.find((entry) => entry.pattern.test(suffix));
  if (!suffixMatch) {
    return { raw, normalized: null, confidence: 0 };
  }

  return {
    raw,
    normalized: Math.round(numericValue * suffixMatch.multiplier),
    confidence: 0.9,
  };
}

/** Handles both "1.2" (decimal point) and "2,4" (decimal comma) as well as thousands separators. */
function parseLocalizedDecimal(value: string): number | null {
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  let normalizedText = value;

  if (hasComma && hasDot) {
    // Assume the last separator is the decimal marker; the other is a thousands separator.
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalizedText = value.replace(/\./g, "").replace(",", ".");
    } else {
      normalizedText = value.replace(/,/g, "");
    }
  } else if (hasComma) {
    // A single comma with 1-2 trailing digits is a decimal marker ("2,4"); otherwise thousands separator.
    const parts = value.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      normalizedText = value.replace(",", ".");
    } else {
      normalizedText = value.replace(/,/g, "");
    }
  } else if (hasDot) {
    const parts = value.split(".");
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      normalizedText = value.replace(/\./g, "");
    }
  }

  const parsed = Number.parseFloat(normalizedText);
  return Number.isFinite(parsed) ? parsed : null;
}
