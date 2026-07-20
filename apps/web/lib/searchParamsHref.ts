export function withPage(searchParams: Record<string, string | string[] | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

/** Toggles a single filter param on/off (clicking an already-active chip clears it), always
 * resetting to page 1 since the result set changes — used by server-rendered filter chips so
 * the whole filter state stays URL-shareable with no client JS required. */
export function withToggledParam(searchParams: Record<string, string | string[] | undefined>, key: string, value: string): string {
  const params = new URLSearchParams();
  const current = searchParams[key];
  const currentValue = Array.isArray(current) ? current[0] : current;
  const isActive = currentValue === value;

  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "page" || k === key || v === undefined) continue;
    params.set(k, Array.isArray(v) ? v[0] : v);
  }
  if (!isActive) params.set(key, value);
  return `?${params.toString()}`;
}
