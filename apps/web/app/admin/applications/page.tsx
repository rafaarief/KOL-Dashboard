"use client";

import { useState } from "react";
import { useFilteredList } from "@/lib/useFilteredList";
import { ApplicationStatusBadge, OcCard, Pagination, formatIDR } from "@/components/oc/primitives";

interface AdminApplicationRow {
  id: string;
  status: string;
  proposedRate: string | null;
  createdAt: string;
  updatedAt: string;
  campaignTitle: string;
  campaignSlug: string;
  brandName: string;
  creatorUsername: string;
  creatorDisplayName: string;
}

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState("");
  const { rows, total, page, setPage, totalPages, isLoading, error } = useFilteredList<AdminApplicationRow>(
    "/api/admin/applications",
    { status }
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Applications</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} campaign applications across the marketplace.</p>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {["submitted", "viewed", "shortlisted", "accepted", "rejected", "withdrawn"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Proposed Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-oc-ink">{row.creatorDisplayName}</p>
                  <p className="text-xs text-oc-ink-muted">@{row.creatorUsername}</p>
                </td>
                <td className="px-4 py-3">{row.campaignTitle}</td>
                <td className="px-4 py-3">{row.brandName}</td>
                <td className="px-4 py-3">{row.proposedRate ? formatIDR(row.proposedRate) : "—"}</td>
                <td className="px-4 py-3">
                  <ApplicationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-oc-ink-muted">
                  No applications found.
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
