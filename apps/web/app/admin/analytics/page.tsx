"use client";

import { useEffect, useState } from "react";
import { OcCard } from "@/components/oc/primitives";

interface SeriesPoint {
  label: string;
  count: number;
}

interface AnalyticsData {
  creatorRegistrations: SeriesPoint[];
  brandRegistrations: SeriesPoint[];
  campaignsCreated: SeriesPoint[];
  applicationsOverTime: SeriesPoint[];
  platformDistribution: SeriesPoint[];
}

function SeriesChart({ title, points }: { title: string; points: SeriesPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <OcCard className="p-5">
      <p className="text-sm font-medium text-oc-ink">{title}</p>
      <div className="mt-4 flex h-32 items-end gap-1">
        {points.map((point) => (
          <div key={point.label} className="group relative flex-1">
            <div
              className="rounded-t bg-oc-500"
              style={{ height: `${Math.max(4, (point.count / max) * 100)}px` }}
              title={`${point.label}: ${point.count}`}
            />
          </div>
        ))}
        {points.length === 0 && <p className="text-sm text-oc-ink-muted">No data yet.</p>}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-oc-ink-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </OcCard>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Analytics</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Marketplace trends over the last 12 weeks.</p>

      {data && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SeriesChart title="Creator registrations" points={data.creatorRegistrations} />
          <SeriesChart title="Brand registrations" points={data.brandRegistrations} />
          <SeriesChart title="Campaigns created" points={data.campaignsCreated} />
          <SeriesChart title="Applications submitted" points={data.applicationsOverTime} />
          <SeriesChart title="Platform distribution" points={data.platformDistribution} />
        </div>
      )}
    </div>
  );
}
