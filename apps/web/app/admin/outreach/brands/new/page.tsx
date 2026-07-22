"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OcButton, OcCard } from "@/components/oc/primitives";
import { OUTREACH_SOURCE_LABELS, OUTREACH_SOURCES } from "@/lib/outreachEnums";
import type { DuplicateMatch } from "@/lib/outreachDuplicateCheck";

interface Category {
  id: string;
  name: string;
}

export default function NewBrandOutreachPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    brandName: "",
    industry: "",
    phone: "",
    socialUrl: "",
    source: "other",
    notes: "",
  });
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/outreach/categories")
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((body) => setCategories(body.categories ?? []));
  }, []);

  async function submit(confirmDuplicate: boolean) {
    setIsSubmitting(true);
    setError(null);

    const isTikTok = form.socialUrl.toLowerCase().includes("tiktok");

    const response = await fetch("/api/admin/outreach/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: form.brandName,
        industry: form.industry,
        phone: form.phone,
        instagramUrl: form.socialUrl && !isTikTok ? form.socialUrl : undefined,
        tiktokUrl: form.socialUrl && isTikTok ? form.socialUrl : undefined,
        source: form.source,
        notes: form.notes,
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
            Category
            <select
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-oc-ink-muted">
            WA phone
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
          </label>
          <label className="text-xs text-oc-ink-muted sm:col-span-2">
            IG/TikTok URL
            <input
              value={form.socialUrl}
              onChange={(e) => setForm((f) => ({ ...f, socialUrl: e.target.value }))}
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
