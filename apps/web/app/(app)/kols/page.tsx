"use client";

import { useEffect, useMemo, useState } from "react";

interface NanoKol {
  id: string;
  fullName: string | null;
  age: string | null;
  gender: string | null;
  normalizedGender: string | null;
  domisili: string | null;
  tiktokUsername: string | null;
  tiktokUrl: string | null;
  tiktokFollowersRaw: string | null;
  tiktokFollowersCount: number | null;
  nicheTiktokRaw: string | null;
  erTiktokRaw: string | null;
  avgViewsTiktokRaw: string | null;
  instagramUsername: string | null;
  instagramUrl: string | null;
  instagramFollowersRaw: string | null;
  instagramFollowersCount: number | null;
  nicheInstagramRaw: string | null;
  erInstagramRaw: string | null;
  avgViewsInstagramRaw: string | null;
  contentReviewLink: string | null;
  phoneNumber: string | null;
  note: string | null;
  categories: string[];
}

interface Facets {
  domisili: string[];
  genders: string[];
  categories: string[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "Recently added" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "highest_tiktok_followers", label: "Highest TikTok followers" },
  { value: "highest_instagram_followers", label: "Highest Instagram followers" },
];

const PAGE_SIZE = 30;

function formatFollowers(count: number | null, raw: string | null): string {
  if (count !== null) return count.toLocaleString();
  return raw ?? "—";
}

export default function KolsPage() {
  const [facets, setFacets] = useState<Facets>({ domisili: [], genders: [], categories: [] });
  const [rows, setRows] = useState<NanoKol[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [domisili, setDomisili] = useState("");
  const [gender, setGender] = useState("");
  const [minTiktokFollowers, setMinTiktokFollowers] = useState("");
  const [hasInstagram, setHasInstagram] = useState(false);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/kols/facets")
      .then((res) => res.json())
      .then((body) => setFacets(body));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => setPage(1), [debouncedQ, category, domisili, gender, minTiktokFollowers, hasInstagram, sort]);

  useEffect(() => {
    const query = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) query.set("q", debouncedQ);
    if (category) query.set("category", category);
    if (domisili) query.set("domisili", domisili);
    if (gender) query.set("gender", gender);
    if (minTiktokFollowers) query.set("minTiktokFollowers", minTiktokFollowers);
    if (hasInstagram) query.set("hasInstagram", "true");

    setIsLoading(true);
    fetch(`/api/kols?${query.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setRows(body.results ?? []);
        setTotal(body.total ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQ, category, domisili, gender, minTiktokFollowers, hasInstagram, sort, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Nano KOL directory</h1>
      <p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} curated nano creators (Blok M roster).</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, TikTok, Instagram, domisili"
          className="w-72 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        >
          <option value="">All categories</option>
          {facets.categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={domisili}
          onChange={(event) => setDomisili(event.target.value)}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        >
          <option value="">All domisili</option>
          {facets.domisili.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value)}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        >
          <option value="">All genders</option>
          {facets.genders.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          value={minTiktokFollowers}
          onChange={(event) => setMinTiktokFollowers(event.target.value)}
          placeholder="Min TikTok followers"
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
          <input type="checkbox" checked={hasInstagram} onChange={(event) => setHasInstagram(event.target.checked)} />
          Has Instagram
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Domisili</th>
              <th className="px-4 py-3">Categories</th>
              <th className="px-4 py-3">TikTok</th>
              <th className="px-4 py-3">TT Followers</th>
              <th className="px-4 py-3">TT ER</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">IG Followers</th>
              <th className="px-4 py-3">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((kol) => (
              <tr key={kol.id} className="text-slate-700 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">
                  {kol.fullName ?? "—"}
                  {kol.age && <span className="ml-2 text-xs text-slate-500">{kol.age}</span>}
                </td>
                <td className="px-4 py-3">{kol.domisili ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {kol.categories.map((cat) => (
                      <span key={cat} className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700">
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {kol.tiktokUrl ? (
                    <a href={kol.tiktokUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      @{kol.tiktokUsername}
                    </a>
                  ) : (
                    kol.tiktokUsername ?? "—"
                  )}
                </td>
                <td className="px-4 py-3">{formatFollowers(kol.tiktokFollowersCount, kol.tiktokFollowersRaw)}</td>
                <td className="px-4 py-3">{kol.erTiktokRaw ?? "—"}</td>
                <td className="px-4 py-3">
                  {kol.instagramUrl ? (
                    <a href={kol.instagramUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      @{kol.instagramUsername}
                    </a>
                  ) : (
                    kol.instagramUsername ?? "—"
                  )}
                </td>
                <td className="px-4 py-3">{formatFollowers(kol.instagramFollowersCount, kol.instagramFollowersRaw)}</td>
                <td className="px-4 py-3">{kol.phoneNumber ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                  No nano KOLs matched these filters.
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
