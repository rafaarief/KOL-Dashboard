"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Shared client-side data-loading pattern used across every filtered/paginated admin and
 * marketplace table in this app (search debounce, page reset on filter change, fetch + error
 * handling, forced reload after a mutation). Extracted here because copy-pasting it per page
 * (the pre-existing convention) was becoming its own source of bugs across 6+ near-identical
 * new admin pages. */
export function useFilteredList<T>(basePath: string, params: Record<string, string | boolean | undefined>, pageSize = 30) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const filterKey = JSON.stringify(params);

  // Reset to page 1 synchronously during render when filters change, rather than in a
  // separate effect. A separate "reset" effect fires the fetch effect twice on every filter
  // change made while not already on page 1 — once with the stale page, once with page 1 —
  // a real duplicate-request bug. Adjusting state during render (React's documented pattern
  // for "derived state that resets on prop change") avoids that extra round trip entirely.
  const previousFilterKeyRef = useRef(filterKey);
  const effectivePage = previousFilterKeyRef.current === filterKey ? page : 1;
  previousFilterKeyRef.current = filterKey;

  useEffect(() => {
    if (effectivePage !== page) setPage(effectivePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePage]);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(effectivePage), pageSize: String(pageSize) });
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }

    // Guards against a race condition: if an earlier, slower request (e.g. from a fast typist
    // in a search box) resolves after a newer one, it must not overwrite the newer results.
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    fetch(`${basePath}?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        setRows(body.results ?? []);
        setTotal(body.total ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, filterKey, effectivePage, pageSize, reloadToken]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return {
    rows,
    total,
    page: effectivePage,
    setPage,
    totalPages,
    isLoading,
    error,
    // Setting page to itself never re-renders in React (Object.is bailout), so a naive
    // `setPage((p) => p)` here silently did nothing — every admin action button (verify,
    // suspend, feature, approve, resolve, ...) called this expecting a refetch and got none.
    reload: () => setReloadToken((t) => t + 1),
  };
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}
