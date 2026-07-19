"use client";

import { useEffect, useState } from "react";
import { OcCard } from "@/components/oc/primitives";

interface CategoryCount {
  label: string;
  count: number;
}

interface Overview {
  totals: {
    totalCreators: number;
    activeCreators: number;
    totalBrands: number;
    verifiedBrands: number;
    activeCampaigns: number;
    applicationsThisMonth: number;
    pendingVerifications: number;
    reportedContent: number;
  };
  campaignsByCategory: CategoryCount[];
  creatorsByNiche: CategoryCount[];
  creatorsByCity: CategoryCount[];
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <OcCard className="px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-oc-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-oc-ink">{value.toLocaleString()}</p>
    </OcCard>
  );
}

function Breakdown({ title, rows }: { title: string; rows: CategoryCount[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <OcCard className="p-5">
      <p className="text-sm font-medium text-oc-ink">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs text-oc-ink-muted">
              <span className="truncate">{row.label}</span>
              <span>{row.count.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-oc-bg">
              <div className="h-2 rounded-full bg-oc-600" style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-oc-ink-muted">No data yet.</p>}
      </div>
    </OcCard>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load overview"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Admin Overview</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">OpenCollab.id marketplace at a glance.</p>

      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total Creators" value={data.totals.totalCreators} />
            <StatTile label="Active Creators" value={data.totals.activeCreators} />
            <StatTile label="Total Brands" value={data.totals.totalBrands} />
            <StatTile label="Verified Brands" value={data.totals.verifiedBrands} />
            <StatTile label="Active Campaigns" value={data.totals.activeCampaigns} />
            <StatTile label="Applications This Month" value={data.totals.applicationsThisMonth} />
            <StatTile label="Pending Verifications" value={data.totals.pendingVerifications} />
            <StatTile label="Reported Content" value={data.totals.reportedContent} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Breakdown title="Campaigns by category" rows={data.campaignsByCategory} />
            <Breakdown title="Creators by niche" rows={data.creatorsByNiche} />
            <Breakdown title="Creators by city" rows={data.creatorsByCity} />
          </div>
        </>
      )}
    </div>
  );
}
