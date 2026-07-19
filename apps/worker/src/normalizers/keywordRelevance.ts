import type { ExtractedVideo, ParsedQuery } from "@kol-finder/schemas";
import type { KeywordRelevanceInputs } from "@kol-finder/ranking";

function normalizeText(value: string | null): string {
  return (value ?? "").toLowerCase();
}

function scoreTextMatch(text: string, terms: string[]): number {
  if (!text || terms.length === 0) return 0;
  const lowerText = text.toLowerCase();

  if (terms.some((term) => lowerText.includes(term.toLowerCase()))) {
    const exactPhrase = terms.some((term) => lowerText === term.toLowerCase());
    return exactPhrase ? 100 : 75;
  }

  const wordOverlap = terms.some((term) =>
    term
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 2 && lowerText.includes(word))
  );

  return wordOverlap ? 35 : 0;
}

/** Deterministic keyword-relevance scoring per PRD section 8.7.3 — inputs, not the final weighted score. */
export function scoreKeywordRelevance(
  video: Pick<ExtractedVideo, "caption" | "hashtags">,
  parsedQuery: Pick<ParsedQuery, "keywordVariations" | "location" | "nicheHints">
): KeywordRelevanceInputs {
  const searchTerms = parsedQuery.keywordVariations;
  const caption = normalizeText(video.caption);

  const captionMatchScore = scoreTextMatch(caption, searchTerms);

  const hashtagText = video.hashtags.join(" ");
  const hashtagMatchScore = scoreTextMatch(hashtagText, [...searchTerms, ...parsedQuery.nicheHints]);

  const nicheMatchScore = scoreTextMatch(`${caption} ${hashtagText}`, parsedQuery.nicheHints);

  const locationMatchScore = parsedQuery.location ? scoreTextMatch(`${caption} ${hashtagText}`, [parsedQuery.location]) : 0;

  return { captionMatchScore, hashtagMatchScore, nicheMatchScore, locationMatchScore };
}
