"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OcBadge, OcCard } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolutionReason: string | null;
  createdAt: string;
}

const TARGET_HREF: Record<string, (id: string) => string> = {
  creator: (id) => `/admin/creators/${id}`,
  brand: (id) => `/admin/brands/${id}`,
  campaign: (id) => `/admin/campaigns/${id}`,
};

const OPEN_STATUSES = new Set(["open", "under_review"]);

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const { showToast } = useToast();
  const [reasonDraftId, setReasonDraftId] = useState<string | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  function load() {
    fetch("/api/admin/reports")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function resolve(id: string, status: "under_review" | "resolved" | "dismissed", resolutionReason?: string) {
    const response = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, resolutionReason }),
    });
    showToast(response.ok ? `Report ${status.replace("_", " ")}.` : "That action failed.", response.ok ? "success" : "error");
    setReasonDraftId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Reports</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">User-submitted reports on campaigns, creators, or brands.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 capitalize">
                  {TARGET_HREF[row.targetType] ? (
                    <Link href={TARGET_HREF[row.targetType](row.targetId)} className="hover:underline">
                      {row.targetType}
                    </Link>
                  ) : (
                    row.targetType
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.reason}
                  {row.resolutionReason && <p className="mt-1 text-xs text-oc-ink-muted">Resolution: {row.resolutionReason}</p>}
                </td>
                <td className="px-4 py-3">
                  <OcBadge tone={row.status === "resolved" ? "success" : row.status === "dismissed" ? "neutral" : "warning"}>
                    {row.status.replace("_", " ")}
                  </OcBadge>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {OPEN_STATUSES.has(row.status) && (
                    <div>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {row.status === "open" && (
                          <button onClick={() => resolve(row.id, "under_review")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                            Escalate
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setReasonDraftId(row.id);
                            setReasonDraft("");
                          }}
                          className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                        >
                          Resolve…
                        </button>
                        <button onClick={() => resolve(row.id, "dismissed")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                          Dismiss
                        </button>
                      </div>
                      {reasonDraftId === row.id && (
                        <div className="mt-2 w-64">
                          <textarea
                            value={reasonDraft}
                            onChange={(e) => setReasonDraft(e.target.value)}
                            rows={2}
                            placeholder="Why is this resolved?"
                            className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-2 py-1.5 text-xs text-oc-ink"
                          />
                          <button
                            onClick={() => resolve(row.id, "resolved", reasonDraft)}
                            className="mt-1 rounded bg-oc-600 px-2 py-1 text-xs font-medium text-white hover:bg-oc-700"
                          >
                            Confirm resolve
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-oc-ink-muted">
                  No reports filed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>
    </div>
  );
}
