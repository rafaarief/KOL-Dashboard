"use client";

import { useEffect, useMemo, useState } from "react";

interface Creator {
  id: string;
  username: string;
  displayName: string | null;
  profileUrl: string;
  bio: string | null;
  followerCount: number | null;
  totalLikeCount: number | null;
  isVerified: boolean | null;
  primaryNiche: string | null;
  inferredLocation: string | null;
  firstDiscoveredAt: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Recently discovered" },
  { value: "most_followers", label: "Most followers" },
  { value: "most_likes", label: "Most total likes" },
  { value: "name_asc", label: "Username (A-Z)" },
];

const PAGE_SIZE = 30;

function formatCount(count: number | null): string {
  return count === null ? "—" : count.toLocaleString();
}

export default function CreatorsDatabasePage() {
  const [niches, setNiches] = useState<string[]>([]);
  const [rows, setRows] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [niche, setNiche] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/creators/facets")
      .then((res) => res.json())
      .then((body) => setNiches(body.niches ?? []))
      .catch(() => {
        // Non-fatal: the niche filter dropdown just stays empty.
      });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => setPage(1), [debouncedQ, niche, minFollowers, verifiedOnly, sort]);

  useEffect(() => {
    const query = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) query.set("q", debouncedQ);
    if (niche) query.set("niche", niche);
    if (minFollowers) query.set("minFollowers", minFollowers);
    if (verifiedOnly) query.set("verifiedOnly", "true");

    setIsLoading(true);
    setError(null);
    fetch(`/api/creators?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
        return res.json();
      })
      .then((body) => {
        setRows(body.results ?? []);
        setTotal(body.total ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load creators"))
      .finally(() => setIsLoading(false));
  }, [debouncedQ, niche, minFollowers, verifiedOnly, sort, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Creator database</h1>
      <p className="mt-1 text-sm text-slate-500">
        {total.toLocaleString()} creators discovered across every keyword search you&apos;ve run.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load creators: {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search username, name, bio"
          className="w-72 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
        />
        <select
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        >
          <option value="">All niches</option>
          {niches.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={minFollowers}
          onChange={(event) => setMinFollowers(event.target.value)}
          placeholder="Min followers"
          className="w-40 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
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

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
          Verified only
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Followers</th>
              <th className="px-4 py-3">Total likes</th>
              <th className="px-4 py-3">Discovered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((creator) => (
              <tr key={creator.id} className="text-slate-700 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <a
                    href={creator.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    @{creator.username}
                  </a>
                  {creator.isVerified && <span className="ml-2 text-xs text-slate-500">✓ verified</span>}
                  {creator.displayName && <p className="text-xs text-slate-500">{creator.displayName}</p>}
                </td>
                <td className="px-4 py-3">{creator.primaryNiche ?? "—"}</td>
                <td className="px-4 py-3">{creator.inferredLocation ?? "—"}</td>
                <td className="px-4 py-3">{formatCount(creator.followerCount)}</td>
                <td className="px-4 py-3">{formatCount(creator.totalLikeCount)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(creator.firstDiscoveredAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No creators matched these filters yet — run a keyword search to populate this.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
