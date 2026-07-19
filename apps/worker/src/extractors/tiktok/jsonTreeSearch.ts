/**
 * TikTok renames the top-level scope keys of its embedded rehydration JSON across deploys,
 * so instead of hardcoding an exact path we walk the whole tree looking for objects that
 * match a given shape. This is intentionally more resilient to markup/schema churn than a
 * fixed selector path — see PRD section 10.6 (selectors isolated, extraction versioned).
 */
export function findAllObjectsMatching(
  root: unknown,
  predicate: (obj: Record<string, unknown>) => boolean,
  maxResults = 1000
): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();

  function walk(node: unknown): void {
    if (results.length >= maxResults) return;
    if (node === null || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (!Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      if (predicate(obj)) results.push(obj);
    }

    const children = Array.isArray(node) ? node : Object.values(node as Record<string, unknown>);
    for (const child of children) {
      if (results.length >= maxResults) return;
      walk(child);
    }
  }

  walk(root);
  return results;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}
