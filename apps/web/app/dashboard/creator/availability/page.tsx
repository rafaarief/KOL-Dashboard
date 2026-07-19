"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface AvailabilityForm {
  availabilityStatus: string;
  monthlyCapacity: number | null;
  slotsRemaining: number | null;
  minimumBudget: string | null;
  acceptsBarter: boolean;
  acceptsAffiliate: boolean;
  acceptsPaid: boolean;
  acceptsEventAttendance: boolean;
  acceptsAmbassador: boolean;
}

export default function CreatorAvailabilityPage() {
  const [form, setForm] = useState<AvailabilityForm | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/creator/profile")
      .then((res) => res.json())
      .then((body) => setForm(body.profile));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setStatus("saving");
    await fetch("/api/creator/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (!form) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <OcCard className="max-w-xl p-6">
      <h1 className="text-lg font-semibold text-oc-ink">Availability & Collaboration Preferences</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-oc-ink">Current status</label>
          <select
            value={form.availabilityStatus}
            onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          >
            <option value="open">Open for Collaboration</option>
            <option value="limited">Limited Availability</option>
            <option value="fully_booked">Fully Booked</option>
            <option value="unavailable">Temporarily Unavailable</option>
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-oc-ink">Monthly capacity</label>
            <input
              type="number"
              value={form.monthlyCapacity ?? ""}
              onChange={(e) => setForm({ ...form, monthlyCapacity: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-oc-ink">Slots remaining</label>
            <input
              type="number"
              value={form.slotsRemaining ?? ""}
              onChange={(e) => setForm({ ...form, slotsRemaining: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Minimum campaign budget (Rp)</label>
          <input
            value={form.minimumBudget ?? ""}
            onChange={(e) => setForm({ ...form, minimumBudget: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-oc-ink">Collaboration types accepted</p>
          {[
            { key: "acceptsPaid" as const, label: "Paid collaboration" },
            { key: "acceptsBarter" as const, label: "Barter" },
            { key: "acceptsAffiliate" as const, label: "Affiliate" },
            { key: "acceptsEventAttendance" as const, label: "Event attendance" },
            { key: "acceptsAmbassador" as const, label: "Long-term brand ambassador" },
          ].map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm text-oc-ink">
              <input
                type="checkbox"
                checked={form[option.key]}
                onChange={(e) => setForm({ ...form, [option.key]: e.target.checked })}
              />
              {option.label}
            </label>
          ))}
        </div>

        <OcButton type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </OcButton>
      </form>
    </OcCard>
  );
}
