"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApplicationStatusBadge, OcCard, formatIDR } from "@/components/oc/primitives";

interface ApplicantRow {
  id: string;
  status: string;
  proposedRate: string | null;
  createdAt: string;
  campaignId: string;
  campaignTitle: string;
  creatorUsername: string;
  creatorDisplayName: string;
}

export default function BrandApplicantsPage() {
  const [rows, setRows] = useState<ApplicantRow[]>([]);

  useEffect(() => {
    fetch("/api/brand/applicants")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-oc-ink">All Applicants</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Across every campaign you&apos;ve posted.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Proposed Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link href={`/creators/${row.creatorUsername}`} className="font-medium text-oc-ink hover:underline">
                    {row.creatorDisplayName}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.campaignTitle}</td>
                <td className="px-4 py-3">{row.proposedRate ? formatIDR(row.proposedRate) : "—"}</td>
                <td className="px-4 py-3">
                  <ApplicationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/brand/campaigns/${row.campaignId}`} className="text-xs text-oc-700 hover:underline">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-oc-ink-muted">
                  No applicants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>
    </div>
  );
}
