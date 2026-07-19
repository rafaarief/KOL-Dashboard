"use client";

import { useEffect, useMemo, useState } from "react";

interface Category {
  id: string;
  categoryName: string;
  icon: string | null;
}

interface Business {
  id: string;
  businessName: string;
  phone: string | null;
  isWhatsappCandidate: boolean;
  website: string | null;
  instagram: string | null;
  rating: string | null;
  reviewCount: number;
  address: string | null;
  city: string | null;
  province: string | null;
  leadScore: number;
  crmStatus: string;
  createdAt: string;
}

interface LeadRow {
  business: Business;
  category: Category | null;
}

const CRM_STATUSES = ["New", "Not Contacted", "Contacted", "Interested", "Meeting", "Negotiation", "Won", "Lost"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest_rating", label: "Highest rating" },
  { value: "highest_lead_score", label: "Highest lead score" },
  { value: "name_asc", label: "Name (A-Z)" },
];

const PAGE_SIZE = 30;

export default function LeadsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [crmStatus, setCrmStatus] = useState("");
  const [minRating, setMinRating] = useState("");
  const [hasWebsite, setHasWebsite] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasInstagram, setHasInstagram] = useState(false);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((body) => setCategories(body.categories ?? []));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => setPage(1), [debouncedQ, categoryId, province, city, crmStatus, minRating, hasWebsite, hasWhatsapp, hasInstagram, sort]);

  useEffect(() => {
    const query = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) query.set("q", debouncedQ);
    if (categoryId) query.set("categoryId", categoryId);
    if (province) query.set("province", province);
    if (city) query.set("city", city);
    if (crmStatus) query.set("crmStatus", crmStatus);
    if (minRating) query.set("minRating", minRating);
    if (hasWebsite) query.set("hasWebsite", "true");
    if (hasWhatsapp) query.set("hasWhatsapp", "true");
    if (hasInstagram) query.set("hasInstagram", "true");

    setIsLoading(true);
    fetch(`/api/leads?${query.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setRows(body.results ?? []);
        setTotal(body.total ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQ, categoryId, province, city, crmStatus, minRating, hasWebsite, hasWhatsapp, hasInstagram, sort, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-100">Leads</h1>
      <p className="mt-1 text-sm text-slate-400">
        {total.toLocaleString()} businesses in the lead database.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, phone, website, Instagram, address"
          className="w-72 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </select>
        <input
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          placeholder="Province"
          className="w-36 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          className="w-36 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
        <select
          value={crmStatus}
          onChange={(event) => setCrmStatus(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="">All CRM statuses</option>
          {CRM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          value={minRating}
          onChange={(event) => setMinRating(event.target.value)}
          placeholder="Min rating"
          className="w-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasWebsite} onChange={(event) => setHasWebsite(event.target.checked)} />
          Has website
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasWhatsapp} onChange={(event) => setHasWhatsapp(event.target.checked)} />
          WhatsApp candidate
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasInstagram} onChange={(event) => setHasInstagram(event.target.checked)} />
          Has Instagram
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Lead score</th>
              <th className="px-4 py-3">CRM status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(({ business, category }) => (
              <tr key={business.id} className="text-slate-300 hover:bg-slate-900/60">
                <td className="px-4 py-3 text-slate-100">{business.businessName}</td>
                <td className="px-4 py-3">{category?.categoryName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span>{business.phone ?? "—"}</span>
                  {business.isWhatsappCandidate && (
                    <span className="ml-2 rounded-full border border-emerald-800 bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-400">
                      WA
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Visit
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{business.instagram ?? "—"}</td>
                <td className="px-4 py-3">
                  {business.rating ? `${business.rating} (${business.reviewCount})` : "—"}
                </td>
                <td className="px-4 py-3">
                  {[business.city, business.province].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{business.leadScore}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    {business.crmStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(business.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                  No leads matched these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
