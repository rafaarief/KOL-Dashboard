"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApplicationStatusBadge, OcCard, formatIDR } from "@/components/oc/primitives";

interface ApplicationRow {
  id: string;
  status: string;
  proposedRate: string | null;
  createdAt: string;
  campaignTitle: string;
  campaignSlug: string;
  applicationDeadline: string | null;
  brandName: string;
}

export default function CreatorApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);

  function load() {
    fetch("/api/creator/applications")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function withdraw(id: string) {
    await fetch("/api/creator/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-oc-ink">Your Applications</h1>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Proposed Rate</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link href={`/campaigns/${row.campaignSlug}`} className="font-medium text-oc-ink hover:underline">
                    {row.campaignTitle}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.brandName}</td>
                <td className="px-4 py-3">{row.proposedRate ? formatIDR(row.proposedRate) : "—"}</td>
                <td className="px-4 py-3 text-xs">{row.applicationDeadline ? new Date(row.applicationDeadline).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <ApplicationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  {row.status === "submitted" && (
                    <button onClick={() => withdraw(row.id)} className="text-xs text-red-600 hover:underline">
                      Withdraw
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-oc-ink-muted">
                  You haven&apos;t applied to any campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>
    </div>
  );
}
