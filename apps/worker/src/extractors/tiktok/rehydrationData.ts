/**
 * TikTok server-renders its initial page state into a <script> tag as JSON. This is publicly
 * shipped in the page response body for anyone loading the page — no auth, no bypass — so
 * reading it is preferred over brittle DOM scraping. Falls back to null if TikTok changes the
 * script id or the payload isn't valid JSON, so callers can fall back to DOM selectors.
 */
const KNOWN_SCRIPT_IDS = ["__UNIVERSAL_DATA_FOR_REHYDRATION__", "SIGI_STATE", "sigi-persisted-data"];

export function extractRehydrationJson(html: string): unknown | null {
  for (const scriptId of KNOWN_SCRIPT_IDS) {
    const pattern = new RegExp(
      `<script[^>]*id=["']${scriptId}["'][^>]*>([\\s\\S]*?)</script>`,
      "i"
    );
    const match = html.match(pattern);
    if (!match) continue;

    try {
      return JSON.parse(match[1].trim());
    } catch {
      continue;
    }
  }

  return null;
}
