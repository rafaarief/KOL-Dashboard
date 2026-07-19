"use client";

import { useState } from "react";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { OcCard, Pagination, VerificationBadge } from "@/components/oc/primitives";

interface AdminBrandRow {
  id: string;
  slug: string;
  brandName: string;
  industry: string | null;
  city: string | null;
  email: string;
  verificationStatus: string;
  status: string;
  featured: boolean;
  activeCampaigns: number;
  createdAt: string;
}

export default function AdminBrandsPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error, reload } = useFilteredList<AdminBrandRow>(
    "/api/admin/brands",
    { q: debouncedQ }
  );

  async function runAction(id: string, action: string) {
    await fetch("/api/admin/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    reload();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Brands</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} brand accounts.</p>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brand or industry"
          className="w-64 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Active Campaigns</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-oc-ink">{row.brandName}</td>
                <td className="px-4 py-3">{row.industry ?? "—"}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.email}</td>
                <td className="px-4 py-3">{row.city ?? "—"}</td>
                <td className="px-4 py-3">{row.activeCampaigns}</td>
                <td className="px-4 py-3">
                  <VerificationBadge status={row.verificationStatus} />
                  {row.verificationStatus !== "verified" && <span className="text-xs text-oc-ink-muted">{row.verificationStatus}</span>}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button onClick={() => runAction(row.id, "verify")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Verify
                    </button>
                    <button
                      onClick={() => runAction(row.id, row.status === "suspended" ? "reactivate" : "suspend")}
                      className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                    >
                      {row.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => runAction(row.id, row.featured ? "unfeature" : "feature")}
                      className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                    >
                      {row.featured ? "Unfeature" : "Feature"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-oc-ink-muted">
                  No brands found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>

      <Pagination page={page} totalPages={totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
    </div>
  );
}
