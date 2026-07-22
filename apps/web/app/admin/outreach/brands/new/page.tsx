"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OcButton, OcCard } from "@/components/oc/primitives";
import { OUTREACH_SOURCE_LABELS, OUTREACH_SOURCES } from "@/lib/outreachEnums";
import type { DuplicateMatch } from "@/lib/outreachDuplicateCheck";

export default function NewBrandOutreachPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    brandName: "",
    industry: "",
    email: "",
    phone: "",
    instagramUrl: "",
    instagramFollowers: "",
    tiktokUrl: "",
    tiktokFollowers: "",
    website: "",
    source: "other",
    notes: "",
  });
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(confirmDuplicate: boolean) {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/outreach/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        instagramFollowers: form.instagramFollowers ? Number(form.instagramFollowers) : undefined,
        tiktokFollowers: form.tiktokFollowers ? Number(form.tiktokFollowers) : undefined,
        confirmDuplicate,
      }),
    });

    if (response.status === 409) {
      const body = await response.json();
      setDuplicates(body.matches ?? []);
      setIsSubmitting(false);
      return;
    }
    if (!response.ok) {
      setError("Could not save this record. Check the fields and try again.");
      setIsSubmitting(false);
      return;
    }

    const body = await response.json();
    router.push(`/admin/outreach/brands/${body.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-oc-ink">Add Brand</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Track a new outreach attempt. You'll be set as the PIC.</p>

      <OcCard className="mt-4 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <label className="text-xs text-oc-ink-muted sm:col-span-2">
            Brand name
            <input
              required
              value={form.brandName}
              onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Industry
            <input
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Website
            <input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Instagram URL
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Instagram followers
            <input
              type="number"
              min={0}
              value={form.instagramFollowers}
              onChange={(e) => setForm((f) => ({ ...f, instagramFollowers: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            TikTok URL
            <input
              value={form.tiktokUrl}
              onChange={(e) => setForm((f) => ({ ...f, tiktokUrl: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            TikTok followers
            <input
              type="number"
              min={0}
              value={form.tiktokFollowers}
              onChange={(e) => setForm((f) => ({ ...f, tiktokFollowers: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted">
            Source
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            >
              {OUTREACH_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {OUTREACH_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-oc-ink-muted sm:col-span-2">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          {duplicates && duplicates.length > 0 && (
            <div className="rounded-oc border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 sm:col-span-2">
              <p className="font-medium">Possible duplicate found.</p>
              <ul className="mt-2 space-y-1">
                {duplicates.map((m) => (
                  <li key={`${m.source}-${m.id}`}>
                    {m.label} — {m.detail}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <OcButton type="button" variant="secondary" onClick={() => setDuplicates(null)}>
                  Cancel
                </OcButton>
                <OcButton type="button" onClick={() => submit(true)} disabled={isSubmitting}>
                  Add anyway
                </OcButton>
              </div>
            </div>
          )}

          {!duplicates && (
            <div className="sm:col-span-2">
              <OcButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Brand"}
              </OcButton>
            </div>
          )}
        </form>
      </OcCard>
    </div>
  );
}
