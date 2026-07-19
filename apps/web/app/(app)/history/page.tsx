"use client";

import { useEffect, useState } from "react";
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

export default function HistoryPage() {
  const [searches, setSearches] = useState<SearchRow[]>([]);

  useEffect(() => {
    fetch("/api/searches")
      .then((res) => res.json())
      .then((body) => setSearches(body.searches ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Search history</h1>
      <p className="mt-1 text-sm text-slate-500">Every search is saved (PRD section 8.13) — reopen any of them below.</p>

      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
        {searches.map((search) => (
          <Link
            key={search.id}
            href={`/search/${search.id}`}
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
        {searches.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No searches yet.</p>}
      </div>
    </div>
  );
}
