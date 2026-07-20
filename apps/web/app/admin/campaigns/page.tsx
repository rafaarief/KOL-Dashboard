"use client";

import { useState } from "react";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { CampaignStatusBadge, OcCard, Pagination, formatIDR } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

const ACTION_LABELS: Record<string, string> = {
  approve: "Campaign approved and published.",
  reject: "Campaign rejected.",
  pause: "Campaign paused.",
  close: "Campaign closed.",
};

interface AdminCampaignRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  budgetType: string;
  budgetPerCreator: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  creatorCountNeeded: number;
  creatorCountAccepted: number;
  applicationDeadline: string | null;
  brandName: string;
  categoryName: string | null;
  applicationCount: number;
}

function budgetLabel(row: AdminCampaignRow): string {
  if (row.budgetPerCreator) return `${formatIDR(row.budgetPerCreator)}/creator`;
  if (row.budgetMin && row.budgetMax) return `${formatIDR(row.budgetMin)}–${formatIDR(row.budgetMax)}`;
  return row.budgetType;
}

export default function AdminCampaignsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error, reload } = useFilteredList<AdminCampaignRow>(
    "/api/admin/campaigns",
    { q: debouncedQ, status }
  );
  const { showToast } = useToast();

  async function runAction(id: string, action: string) {
    const response = await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    showToast(response.ok ? ACTION_LABELS[action] ?? "Updated." : "That action failed.", response.ok ? "success" : "error");
    reload();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Campaigns</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} campaigns.</p>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title"
          className="w-64 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {["draft", "pending_review", "published", "paused", "closed", "expired", "filled", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Quota</th>
              <th className="px-4 py-3">Applications</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-oc-ink">{row.title}</td>
                <td className="px-4 py-3">{row.brandName}</td>
                <td className="px-4 py-3">{row.categoryName ?? "—"}</td>
                <td className="px-4 py-3">{budgetLabel(row)}</td>
                <td className="px-4 py-3">
                  {row.creatorCountAccepted}/{row.creatorCountNeeded}
                </td>
                <td className="px-4 py-3">{row.applicationCount}</td>
                <td className="px-4 py-3 text-xs">{row.applicationDeadline ? new Date(row.applicationDeadline).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <CampaignStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button onClick={() => runAction(row.id, "approve")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Approve
                    </button>
                    <button onClick={() => runAction(row.id, "reject")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Reject
                    </button>
                    <button onClick={() => runAction(row.id, "pause")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Pause
                    </button>
                    <button onClick={() => runAction(row.id, "close")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-oc-ink-muted">
                  No campaigns found.
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
