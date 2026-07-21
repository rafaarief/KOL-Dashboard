"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface TaxonomyRow {
  id: string;
  name: string;
  creatorCount?: number;
  campaignCount?: number;
}

interface TaxonomyData {
  categories: TaxonomyRow[];
  niches: TaxonomyRow[];
  platforms: TaxonomyRow[];
  collaborationTypes: TaxonomyRow[];
}

function TaxonomySection({
  title,
  type,
  items,
  onAdded,
}: {
  title: string;
  type: string;
  items: TaxonomyRow[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSubmitting(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name }),
    });
    setName("");
    setSubmitting(false);
    onAdded();
  }

  return (
    <OcCard className="p-5">
      <p className="text-sm font-medium text-oc-ink">{title}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item.id} className="rounded-full border border-oc-border px-2.5 py-0.5 text-xs text-oc-ink-muted">
            {item.name}
            {(item.creatorCount !== undefined || item.campaignCount !== undefined) && (
              <span>
                {" — "}
                {[
                  item.creatorCount !== undefined ? `${item.creatorCount} KOLs` : null,
                  item.campaignCount !== undefined ? `${item.campaignCount} campaigns` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </span>
        ))}
        {items.length === 0 && <p className="text-xs text-oc-ink-muted">None yet.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}`}
          className="flex-1 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <OcButton variant="secondary" onClick={handleAdd} disabled={submitting}>
          Add
        </OcButton>
      </div>
    </OcCard>
  );
}

export default function AdminCategoriesPage() {
  const [data, setData] = useState<TaxonomyData | null>(null);

  function load() {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setData);
  }

  useEffect(load, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Categories & Taxonomy</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Manage campaign categories, KOL niches, platforms, and collaboration types.</p>

      {data && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TaxonomySection title="Campaign Categories" type="category" items={data.categories} onAdded={load} />
          <TaxonomySection title="KOL Niches" type="niche" items={data.niches} onAdded={load} />
          <TaxonomySection title="Platforms" type="platform" items={data.platforms} onAdded={load} />
          <TaxonomySection title="Collaboration Types" type="collaborationType" items={data.collaborationTypes} onAdded={load} />
        </div>
      )}
    </div>
  );
}
