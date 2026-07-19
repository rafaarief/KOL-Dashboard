"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CampaignStatusBadge, OcCard } from "@/components/oc/primitives";

interface CampaignRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  creatorCountNeeded: number;
  creatorCountAccepted: number;
  applicationDeadline: string | null;
  applicationCount: number;
  shortlistedCount: number;
  acceptedCount: number;
}

export default function BrandCampaignsPage() {
  const [rows, setRows] = useState<CampaignRow[]>([]);

  useEffect(() => {
    fetch("/api/brand/campaigns")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-oc-ink">Your Campaigns</h1>
        <Link href="/dashboard/brand/campaigns/new" className="rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700">
          Post Campaign
        </Link>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quota</th>
              <th className="px-4 py-3">Applicants</th>
              <th className="px-4 py-3">Shortlisted</th>
              <th className="px-4 py-3">Accepted</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-oc-ink">{row.title}</td>
                <td className="px-4 py-3">
                  <CampaignStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  {row.creatorCountAccepted}/{row.creatorCountNeeded}
                </td>
                <td className="px-4 py-3">{row.applicationCount}</td>
                <td className="px-4 py-3">{row.shortlistedCount}</td>
                <td className="px-4 py-3">{row.acceptedCount}</td>
                <td className="px-4 py-3 text-xs">{row.applicationDeadline ? new Date(row.applicationDeadline).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/brand/campaigns/${row.id}`} className="text-xs text-oc-700 hover:underline">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-oc-ink-muted">
                  You haven&apos;t posted any campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>
    </div>
  );
}
