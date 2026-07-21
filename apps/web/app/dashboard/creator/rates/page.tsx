"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard, formatIDR } from "@/components/oc/primitives";

interface RateCard {
  id: string;
  deliverableType: string;
  price: string | null;
  visibility: string;
}

// Common breakdown items brands ask for — single deliverables plus a couple of pre-bundled
// combos KOLs frequently sell as one line item. Free text still works for anything else.
const SINGLE_DELIVERABLE_PRESETS = ["Instagram Story", "Instagram Feed Post", "Instagram Reels", "TikTok Video", "Brand Visit / Event Appearance"];
const PACKAGE_DELIVERABLE_PRESETS = ["TikTok Video + Mirror IG Reels", "All-in Package (Story + Feed + Reels + TikTok)"];

export default function CreatorRatesPage() {
  const [rates, setRates] = useState<RateCard[]>([]);
  const [deliverableType, setDeliverableType] = useState("");
  const [price, setPrice] = useState("");
  const [visibility, setVisibility] = useState("starting_from");

  function load() {
    fetch("/api/creator/rates")
      .then((res) => res.json())
      .then((body) => setRates(body.results ?? []));
  }

  useEffect(load, []);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!deliverableType.trim()) return;
    await fetch("/api/creator/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliverableType, price: price || undefined, visibility }),
    });
    setDeliverableType("");
    setPrice("");
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/creator/rates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-oc-ink">Rate Card</h1>
      <p className="mt-1 text-xs text-oc-ink-muted">
        Break your KOL Fee down by deliverable — brands can search by fee, so a clear breakdown gets you shortlisted faster.
      </p>

      <OcCard className="mt-4 divide-y divide-oc-border">
        {rates.map((rate) => (
          <div key={rate.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-oc-ink">{rate.deliverableType}</p>
              <p className="text-xs text-oc-ink-muted">
                {rate.visibility === "contact" ? "Contact for rate" : rate.visibility === "negotiable" ? "Negotiable" : `From ${formatIDR(rate.price)}`}
              </p>
            </div>
            <button onClick={() => handleDelete(rate.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        {rates.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-oc-ink-muted">
            <p className="font-medium text-oc-ink">Your rate card is empty.</p>
            <p className="mx-auto mt-1 max-w-sm text-xs">
              A transparent rate card is the #1 thing brands look for — it tells them upfront whether you fit their budget, so they reach out instead of scrolling past.
            </p>
          </div>
        )}
      </OcCard>

      <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-oc border border-oc-border bg-oc-card p-4">
        <div>
          <p className="text-xs font-medium text-oc-ink-muted">Single deliverables</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SINGLE_DELIVERABLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDeliverableType(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  deliverableType === preset ? "border-oc-600 bg-oc-600 text-white" : "border-oc-border bg-oc-bg text-oc-ink hover:border-oc-600"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-xs font-medium text-oc-ink-muted">Packages</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PACKAGE_DELIVERABLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDeliverableType(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  deliverableType === preset ? "border-oc-600 bg-oc-600 text-white" : "border-oc-border bg-oc-bg text-oc-ink hover:border-oc-600"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <input
          value={deliverableType}
          onChange={(e) => setDeliverableType(e.target.value)}
          placeholder="e.g. TikTok video, or type your own package"
          className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (Rp)"
            className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm">
            <option value="public">Public</option>
            <option value="starting_from">Starting from</option>
            <option value="negotiable">Negotiable</option>
            <option value="contact">Contact for rate</option>
          </select>
        </div>
        <OcButton type="submit">Add Rate</OcButton>
      </form>
    </div>
  );
}
