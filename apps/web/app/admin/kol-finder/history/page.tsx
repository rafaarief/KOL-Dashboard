"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface SearchRow {
  id: string;
  originalQuery: string;
  status: string;
  creatorCount: number;
  candidateVideoCount: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-600",
  running: "text-amber-600",
  queued: "text-slate-500",
  failed: "text-red-600",
  cancelled: "text-slate-500",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "keyword_asc", label: "Keyword (A-Z)" },
  { value: "keyword_desc", label: "Keyword (Z-A)" },
  { value: "most_creators", label: "Most creators found" },
];

export default function HistoryPage() {
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/searches")
      .then((res) => res.json())
      .then((body) => setSearches(body.searches ?? []));
  }, []);

  const visibleSearches = useMemo(() => {
    const filtered = q
      ? searches.filter((search) => search.originalQuery.toLowerCase().includes(q.toLowerCase()))
      : searches;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "keyword_asc":
          return a.originalQuery.localeCompare(b.originalQuery);
        case "keyword_desc":
          return b.originalQuery.localeCompare(a.originalQuery);
        case "most_creators":
          return b.creatorCount - a.creatorCount;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [searches, q, sort]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Search history</h1>
      <p className="mt-1 text-sm text-slate-500">Every search is saved (PRD section 8.13) — reopen any of them below.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Filter by keyword"
          className="w-72 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
        {visibleSearches.map((search) => (
          <Link
            key={search.id}
            href={`/admin/kol-finder/search/${search.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm text-slate-900">{search.originalQuery}</p>
              <p className="text-xs text-slate-500">{new Date(search.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right text-xs">
              <p className={STATUS_COLORS[search.status] ?? "text-slate-500"}>{search.status}</p>
              <p className="text-slate-500">{search.creatorCount} creators</p>
            </div>
          </Link>
        ))}
        {visibleSearches.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">
            {searches.length === 0 ? "No searches yet." : "No searches match this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
