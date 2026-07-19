"use client";

import { useEffect, useState } from "react";
import { OcBadge, OcCard } from "@/components/oc/primitives";

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);

  function load() {
    fetch("/api/admin/reports")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function resolve(id: string, status: "resolved" | "dismissed") {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Reports</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">User-submitted reports on campaigns, creators, or brands.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
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
                <td className="px-4 py-3 capitalize">{row.targetType}</td>
                <td className="px-4 py-3">{row.reason}</td>
                <td className="px-4 py-3">
                  <OcBadge tone={row.status === "resolved" ? "success" : row.status === "dismissed" ? "neutral" : "warning"}>
                    {row.status}
                  </OcBadge>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {row.status === "open" && (
                    <div className="flex gap-1.5 text-xs">
                      <button onClick={() => resolve(row.id, "resolved")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                        Resolve
                      </button>
                      <button onClick={() => resolve(row.id, "dismissed")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                        Dismiss
                      </button>
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
