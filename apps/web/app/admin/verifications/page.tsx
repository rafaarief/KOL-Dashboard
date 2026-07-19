"use client";

import { useEffect, useState } from "react";
import { OcBadge, OcCard } from "@/components/oc/primitives";

interface VerificationRow {
  id: string;
  subjectType: string;
  subjectLabel: string;
  status: string;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const [rows, setRows] = useState<VerificationRow[]>([]);

  function load() {
    fetch("/api/admin/verifications")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function decide(id: string, decision: "approved" | "rejected") {
    await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Verification Requests</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Approve or reject creator and brand verification requests.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
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
                  <OcBadge tone={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}>
                    {row.status}
                  </OcBadge>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {row.status === "pending" && (
                    <div className="flex gap-1.5 text-xs">
                      <button onClick={() => decide(row.id, "approved")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                        Approve
                      </button>
                      <button onClick={() => decide(row.id, "rejected")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                        Reject
                      </button>
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
