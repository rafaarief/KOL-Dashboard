import type { NicheClassification } from "@kol-finder/schemas";
import { NICHE_KEYWORD_HINTS, type Niche } from "@kol-finder/shared";

export interface NicheClassificationInput {
  bio: string | null;
  recentCaptions: string[];
  hashtags: string[];
}

/** Deterministic fallback used when no AI provider key is configured or the AI call fails. */
export function classifyNicheDeterministically(input: NicheClassificationInput): NicheClassification {
  const haystack = `${input.bio ?? ""} ${input.recentCaptions.join(" ")} ${input.hashtags.join(" ")}`.toLowerCase();

  const scored = (Object.entries(NICHE_KEYWORD_HINTS) as Array<[Niche, string[]]>)
    .map(([niche, keywords]) => ({
      niche,
      matches: keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length,
    }))
    .filter((entry) => entry.matches > 0)
    .sort((a, b) => b.matches - a.matches);

  if (scored.length === 0) {
    return {
      primaryNiche: "General Creator",
      secondaryNiches: [],
      confidence: 0.3,
      reason: "No strong keyword signal in the bio or recent captions; defaulted to General Creator.",
    };
  }

  const [top, ...rest] = scored;
  const totalMatches = scored.reduce((sum, entry) => sum + entry.matches, 0);

  return {
    primaryNiche: top.niche,
    secondaryNiches: rest.slice(0, 2).map((entry) => entry.niche),
    confidence: Math.min(0.85, 0.4 + top.matches / Math.max(totalMatches, 1)),
    reason: `Bio, captions, and hashtags most frequently referenced ${top.niche.toLowerCase()} topics.`,
  };
}
