"use client";

import { useEffect, useMemo, useState } from "react";

/** Shared client-side data-loading pattern used across every filtered/paginated admin and
 * marketplace table in this app (search debounce, page reset on filter change, fetch + error
 * handling). Extracted here because copy-pasting it per page (the pre-existing convention)
 * was becoming its own source of bugs across 6+ near-identical new admin pages. */
export function useFilteredList<T>(basePath: string, params: Record<string, string | boolean | undefined>, pageSize = 30) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(params);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }

    setIsLoading(true);
    setError(null);
    fetch(`${basePath}?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
        return res.json();
      })
      .then((body) => {
        setRows(body.results ?? []);
        setTotal(body.total ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, filterKey, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return { rows, total, page, setPage, totalPages, isLoading, error, reload: () => setPage((p) => p) };
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}
