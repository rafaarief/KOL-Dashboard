import { NICHE_KEYWORD_HINTS, type Niche } from "@kol-finder/shared";

/** Cheap deterministic per-video category tag used before the (slower, AI-backed) creator-level niche classification. */
export function classifyContentCategory(caption: string | null, hashtags: string[]): Niche | null {
  const haystack = `${caption ?? ""} ${hashtags.join(" ")}`.toLowerCase();
  if (!haystack.trim()) return null;

  let bestNiche: Niche | null = null;
  let bestMatches = 0;

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORD_HINTS) as Array<[Niche, string[]]>) {
    const matches = keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length;
    if (matches > bestMatches) {
      bestMatches = matches;
      bestNiche = niche;
    }
  }

  return bestMatches > 0 ? bestNiche : null;
}
