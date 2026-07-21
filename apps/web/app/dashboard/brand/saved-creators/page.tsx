"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OcCard } from "@/components/oc/primitives";

interface SavedCreator {
  creatorProfileId: string;
  username: string;
  displayName: string;
  city: string | null;
}

export default function BrandSavedCreatorsPage() {
  const [rows, setRows] = useState<SavedCreator[]>([]);

  function load() {
    fetch("/api/brand/saved-creators")
      .then((res) => res.json())
      .then((body) => setRows(body.results ?? []));
  }

  useEffect(load, []);

  async function unsave(id: string) {
    await fetch("/api/brand/saved-creators", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-oc-ink">Saved KOLs</h1>

      <OcCard className="mt-4 divide-y divide-oc-border">
        {rows.map((row) => (
          <div key={row.creatorProfileId} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <Link href={`/creators/${row.username}`} className="font-medium text-oc-ink hover:underline">
                {row.displayName}
              </Link>
              <p className="text-xs text-oc-ink-muted">@{row.username} {row.city ? `· ${row.city}` : ""}</p>
            </div>
            <button onClick={() => unsave(row.creatorProfileId)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-oc-ink-muted">
            <p className="font-medium text-oc-ink">You haven&apos;t saved any KOLs.</p>
            <p className="mx-auto mt-1 max-w-sm text-xs">Save KOLs while browsing to build a shortlist before inviting them to a campaign.</p>
          </div>
        )}
      </OcCard>
    </div>
  );
}
