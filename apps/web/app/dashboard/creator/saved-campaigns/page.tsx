"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CampaignStatusBadge, OcCard } from "@/components/oc/primitives";

interface SavedCampaign {
  campaignId: string;
  title: string;
  slug: string;
  status: string;
  brandName: string;
}

export default function CreatorSavedCampaignsPage() {
  const [rows, setRows] = useState<SavedCampaign[]>([]);

  function load() {
    fetch("/api/creator/saved-campaigns")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function unsave(campaignId: string) {
    await fetch("/api/creator/saved-campaigns", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: campaignId }) });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-oc-ink">Saved Campaigns</h1>

      <OcCard className="mt-4 divide-y divide-oc-border">
        {rows.map((row) => (
          <div key={row.campaignId} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <Link href={`/campaigns/${row.slug}`} className="font-medium text-oc-ink hover:underline">
                {row.title}
              </Link>
              <p className="text-xs text-oc-ink-muted">{row.brandName}</p>
            </div>
            <div className="flex items-center gap-3">
              <CampaignStatusBadge status={row.status} />
              <button onClick={() => unsave(row.campaignId)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="px-4 py-6 text-sm text-oc-ink-muted">No saved campaigns yet.</p>}
      </OcCard>
    </div>
  );
}
