"use client";

import { useEffect, useState } from "react";
import { OcBadge, OcCard } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface VerificationRow {
  id: string;
  subjectType: string;
  subjectLabel: string;
  status: string;
  reviewerNote: string | null;
  createdAt: string;
}

const OPEN_STATUSES = new Set(["pending", "needs_information"]);
const TONE: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
  approved: "success",
  rejected: "danger",
  revoked: "danger",
  needs_information: "info",
  pending: "warning",
};

export default function AdminVerificationsPage() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const { showToast } = useToast();
  const [noteDraftId, setNoteDraftId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  function load() {
    fetch("/api/admin/verifications")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function decide(id: string, decision: "approved" | "rejected" | "needs_information") {
    const response = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, reviewerNote: noteDraftId === id ? noteDraft : undefined }),
    });
    showToast(response.ok ? `Verification marked ${decision.replace("_", " ")}.` : "That action failed.", response.ok ? "success" : "error");
    setNoteDraftId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Verification Requests</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Approve, reject, or request more information on creator and brand verification requests.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-oc-ink">{row.subjectLabel}</td>
                <td className="px-4 py-3 capitalize">{row.subjectType}</td>
                <td className="px-4 py-3">
                  <OcBadge tone={TONE[row.status] ?? "neutral"}>{row.status.replace("_", " ")}</OcBadge>
                  {row.reviewerNote && <p className="mt-1 text-xs text-oc-ink-muted">{row.reviewerNote}</p>}
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {OPEN_STATUSES.has(row.status) && (
                    <div>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <button onClick={() => decide(row.id, "approved")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                          Approve
                        </button>
                        <button onClick={() => decide(row.id, "rejected")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            if (noteDraftId === row.id) decide(row.id, "needs_information");
                            else {
                              setNoteDraftId(row.id);
                              setNoteDraft("");
                            }
                          }}
                          className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                        >
                          Need info
                        </button>
                      </div>
                      {noteDraftId === row.id && (
                        <div className="mt-2 w-64">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            rows={2}
                            placeholder="What's missing?"
                            className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-2 py-1.5 text-xs text-oc-ink"
                          />
                          <button onClick={() => decide(row.id, "needs_information")} className="mt-1 rounded bg-oc-600 px-2 py-1 text-xs font-medium text-white hover:bg-oc-700">
                            Send request
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
                  No verification requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>
    </div>
  );
}
