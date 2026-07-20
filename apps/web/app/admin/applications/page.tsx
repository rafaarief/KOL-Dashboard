"use client";

import { useState } from "react";
import Link from "next/link";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { ApplicationStatusBadge, OcCard, Pagination, formatIDR } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface AdminApplicationRow {
  id: string;
  status: string;
  proposedRate: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  brandName: string;
  creatorUsername: string;
  creatorDisplayName: string;
}

export default function AdminApplicationsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error, reload } = useFilteredList<AdminApplicationRow>(
    "/api/admin/applications",
    { q: debouncedQ, status }
  );
  const { showToast } = useToast();
  const [noteDraftId, setNoteDraftId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeStatus(id: string, newStatus: string) {
    setBusyId(id);
    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusyId(null);
    showToast(response.ok ? `Application marked ${newStatus}.` : payload.message ?? "That action failed.", response.ok ? "success" : "error");
    reload();
  }

  async function saveNote(id: string) {
    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminNote: noteDraft }),
    });
    showToast(response.ok ? "Note saved." : "Couldn't save note.", response.ok ? "success" : "error");
    setNoteDraftId(null);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-oc-ink">Applications</h1>
          <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} campaign applications across the marketplace.</p>
        </div>
        <a href="/api/admin/applications?format=csv" className="rounded-oc-input border border-oc-border px-3.5 py-1.5 text-sm hover:bg-oc-bg">
          Export CSV
        </a>
      </div>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creator, campaign, or brand"
          className="w-72 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
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
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Proposed Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-oc-ink">{row.creatorDisplayName}</p>
                  <p className="text-xs text-oc-ink-muted">@{row.creatorUsername}</p>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/campaigns/${row.campaignId}`} className="hover:underline">
                    {row.campaignTitle}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.brandName}</td>
                <td className="px-4 py-3">{row.proposedRate ? formatIDR(row.proposedRate) : "—"}</td>
                <td className="px-4 py-3">
                  <ApplicationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {row.status !== "withdrawn" && (
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button disabled={busyId === row.id} onClick={() => changeStatus(row.id, "shortlisted")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50">
                        Shortlist
                      </button>
                      <button disabled={busyId === row.id} onClick={() => changeStatus(row.id, "accepted")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50">
                        Accept
                      </button>
                      <button disabled={busyId === row.id} onClick={() => changeStatus(row.id, "rejected")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50">
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setNoteDraftId(row.id);
                          setNoteDraft(row.adminNote ?? "");
                        }}
                        className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                      >
                        {row.adminNote ? "Edit note" : "Add note"}
                      </button>
                    </div>
                  )}
                  {noteDraftId === row.id && (
                    <div className="mt-2 w-64">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={2}
                        placeholder="Internal note — never shown to the creator or brand"
                        className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-2 py-1.5 text-xs text-oc-ink"
                      />
                      <div className="mt-1 flex gap-1.5">
                        <button onClick={() => saveNote(row.id)} className="rounded bg-oc-600 px-2 py-1 text-xs font-medium text-white hover:bg-oc-700">
                          Save
                        </button>
                        <button onClick={() => setNoteDraftId(null)} className="rounded border border-oc-border px-2 py-1 text-xs hover:bg-oc-bg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-oc-ink-muted">
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
