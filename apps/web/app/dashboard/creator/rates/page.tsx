"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard, formatIDR } from "@/components/oc/primitives";

interface RateCard {
  id: string;
  deliverableType: string;
  price: string | null;
  visibility: string;
}

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
        <input
          value={deliverableType}
          onChange={(e) => setDeliverableType(e.target.value)}
          placeholder="e.g. TikTok video"
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
