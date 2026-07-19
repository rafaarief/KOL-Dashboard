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
      <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
      <p className="mt-1 text-sm text-slate-500">
        {total.toLocaleString()} businesses in the lead database.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, phone, website, Instagram, address"
          className="w-72 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
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
          className="w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          className="w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        />
        <select
          value={crmStatus}
          onChange={(event) => setCrmStatus(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
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
          className="w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-slate-500">
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
          <tbody className="divide-y divide-gray-200">
            {rows.map(({ business, category }) => (
              <tr key={business.id} className="text-slate-700 hover:bg-gray-50">
                <td className="px-4 py-3 text-slate-900">{business.businessName}</td>
                <td className="px-4 py-3">{category?.categoryName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span>{business.phone ?? "—"}</span>
                  {business.isWhatsappCandidate && (
                    <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      WA
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
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
                  <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-slate-600">
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

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
