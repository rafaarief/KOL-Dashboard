"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CategoryCount {
  label: string;
  count: number;
}

interface RecentSearch {
  id: string;
  originalQuery: string;
  status: string;
  creatorCount: number;
  createdAt: string;
}

interface Summary {
  totals: { creators: number; nanoKols: number; searches: number };
  creatorsByNiche: CategoryCount[];
  nanoKolsByCategory: CategoryCount[];
  searchesByStatus: CategoryCount[];
  recentSearches: RecentSearch[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-600",
  running: "text-amber-600",
  queued: "text-slate-500",
  failed: "text-red-600",
  cancelled: "text-slate-500",
};

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function CategoryBreakdown({ title, rows }: { title: string; rows: CategoryCount[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="truncate">{row.label}</span>
              <span className="ml-2 tabular-nums text-slate-500">{row.count.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
        return res.json();
      })
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">What&apos;s in your KOL database right now, categorized.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load dashboard: {error}
        </div>
      )}

      {summary && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Scraped creators" value={summary.totals.creators} />
            <StatTile label="Nano KOL directory" value={summary.totals.nanoKols} />
            <StatTile label="Keyword searches run" value={summary.totals.searches} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryBreakdown title="Scraped creators by niche" rows={summary.creatorsByNiche} />
            <CategoryBreakdown title="Nano KOLs by category" rows={summary.nanoKolsByCategory} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryBreakdown title="Searches by status" rows={summary.searchesByStatus} />

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">Recent searches</p>
                <Link href="/admin/kol-finder/history" className="text-xs text-indigo-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {summary.recentSearches.map((search) => (
                  <Link
                    key={search.id}
                    href={`/admin/kol-finder/search/${search.id}`}
                    className="flex items-center justify-between py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="truncate text-slate-800">{search.originalQuery}</span>
                    <span className={`ml-2 shrink-0 text-xs ${STATUS_COLORS[search.status] ?? "text-slate-500"}`}>
                      {search.status}
                    </span>
                  </Link>
                ))}
                {summary.recentSearches.length === 0 && <p className="py-2 text-sm text-slate-500">No searches yet.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
