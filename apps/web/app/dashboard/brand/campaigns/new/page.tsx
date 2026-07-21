"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface Category {
  id: string;
  name: string;
}

const STEPS = ["Basics", "Requirements", "Scope of Work", "Budget", "Timeline", "Review & Publish"];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    shortDescription: "",
    fullDescription: "",
    productOrService: "",
    minimumFollowers: "",
    maximumFollowers: "",
    city: "",
    isRemote: true,
    deliverablesText: "",
    requirements: "",
    creatorCountNeeded: "3",
    budgetType: "fixed" as "fixed" | "range" | "barter" | "affiliate" | "negotiable",
    budgetPerCreator: "",
    budgetMin: "",
    budgetMax: "",
    applicationDeadline: "",
    contentDeadline: "",
    campaignStartDate: "",
    campaignEndDate: "",
  });

  useEffect(() => {
    fetch("/api/marketplace/categories")
      .then((res) => res.json())
      .then((body) => setCategories(body.categories ?? []))
      .catch(() => {
        // Non-fatal — category becomes optional if this fails to load.
      });
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePublish(publishNow: boolean) {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/brand/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        categoryId: form.categoryId || undefined,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        productOrService: form.productOrService || undefined,
        locationType: form.isRemote ? "remote" : "onsite",
        city: form.isRemote ? undefined : form.city,
        isRemote: form.isRemote,
        creatorCountNeeded: Number.parseInt(form.creatorCountNeeded, 10) || 1,
        budgetType: form.budgetType,
        budgetPerCreator: form.budgetPerCreator || undefined,
        budgetMin: form.budgetMin || undefined,
        budgetMax: form.budgetMax || undefined,
        compensationType: form.budgetType === "barter" ? "barter" : form.budgetType === "affiliate" ? "affiliate" : "paid",
        deliverables: form.deliverablesText.split("\n").map((s) => s.trim()).filter(Boolean),
        requirements: form.requirements || undefined,
        minimumFollowers: form.minimumFollowers ? Number.parseInt(form.minimumFollowers, 10) : undefined,
        maximumFollowers: form.maximumFollowers ? Number.parseInt(form.maximumFollowers, 10) : undefined,
        applicationDeadline: form.applicationDeadline || undefined,
        contentDeadline: form.contentDeadline || undefined,
        campaignStartDate: form.campaignStartDate || undefined,
        campaignEndDate: form.campaignEndDate || undefined,
        publishNow,
      }),
    });

    if (!response.ok) {
      setError("Could not save this campaign. Check required fields and try again.");
      setIsSubmitting(false);
      return;
    }

    const body = await response.json();
    router.push(publishNow ? `/campaigns/${body.slug}` : `/dashboard/brand/campaigns/${body.campaignId}`);
  }

  const canProceedFromStep0 = form.title.trim().length >= 3 && form.shortDescription.trim().length >= 10 && form.fullDescription.trim().length >= 20;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-oc-ink">Post a New Campaign</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto text-xs">
        {STEPS.map((label, index) => (
          <span
            key={label}
            className={`whitespace-nowrap rounded-full px-3 py-1 ${index === step ? "bg-oc-600 text-white" : "bg-oc-bg text-oc-ink-muted"}`}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      <OcCard className="mt-4 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oc-ink">Campaign title</label>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Category</label>
              <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm">
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Short summary</label>
              <input value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Full description</label>
              <textarea rows={4} value={form.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Product or service</label>
              <input value={form.productOrService} onChange={(e) => update("productOrService", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-oc-ink">Minimum followers</label>
                <input value={form.minimumFollowers} onChange={(e) => update("minimumFollowers", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-oc-ink">Maximum followers</label>
                <input value={form.maximumFollowers} onChange={(e) => update("maximumFollowers", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-oc-ink">
              <input type="checkbox" checked={form.isRemote} onChange={(e) => update("isRemote", e.target.checked)} />
              Remote submissions allowed
            </label>
            {!form.isRemote && (
              <div>
                <label className="text-sm font-medium text-oc-ink">Preferred city</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oc-ink">Deliverables (one per line)</label>
              <textarea rows={4} value={form.deliverablesText} onChange={(e) => update("deliverablesText", e.target.value)} placeholder={"1 TikTok video\n1 Instagram Story"} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Requirements</label>
              <textarea rows={3} value={form.requirements} onChange={(e) => update("requirements", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oc-ink">Total KOLs needed</label>
              <input type="number" value={form.creatorCountNeeded} onChange={(e) => update("creatorCountNeeded", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Budget type</label>
              <select value={form.budgetType} onChange={(e) => update("budgetType", e.target.value as typeof form.budgetType)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm">
                <option value="fixed">Fixed per creator</option>
                <option value="range">Budget range</option>
                <option value="barter">Barter</option>
                <option value="affiliate">Affiliate</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
            {form.budgetType === "fixed" || form.budgetType === "barter" ? (
              <div>
                <label className="text-sm font-medium text-oc-ink">Budget per creator (Rp)</label>
                <input value={form.budgetPerCreator} onChange={(e) => update("budgetPerCreator", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
            ) : form.budgetType === "range" ? (
              <div className="flex gap-3">
                <input value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} placeholder="Min (Rp)" className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
                <input value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} placeholder="Max (Rp)" className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
            ) : null}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oc-ink">Application deadline</label>
              <input type="date" value={form.applicationDeadline} onChange={(e) => update("applicationDeadline", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-oc-ink">Content deadline</label>
              <input type="date" value={form.contentDeadline} onChange={(e) => update("contentDeadline", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-oc-ink">Campaign start</label>
                <input type="date" value={form.campaignStartDate} onChange={(e) => update("campaignStartDate", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-oc-ink">Campaign end</label>
                <input type="date" value={form.campaignEndDate} onChange={(e) => update("campaignEndDate", e.target.value)} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium text-oc-ink">Title:</span> {form.title || "—"}
            </p>
            <p>
              <span className="font-medium text-oc-ink">Summary:</span> {form.shortDescription || "—"}
            </p>
            <p>
              <span className="font-medium text-oc-ink">KOLs needed:</span> {form.creatorCountNeeded}
            </p>
            <p>
              <span className="font-medium text-oc-ink">Budget:</span> {form.budgetType}
            </p>
            <p>
              <span className="font-medium text-oc-ink">Application deadline:</span> {form.applicationDeadline || "Rolling"}
            </p>
            {error && <p className="text-red-600">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <OcButton variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </OcButton>
          {step < STEPS.length - 1 ? (
            <OcButton disabled={step === 0 && !canProceedFromStep0} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next
            </OcButton>
          ) : (
            <div className="flex gap-2">
              <OcButton variant="secondary" disabled={isSubmitting} onClick={() => handlePublish(false)}>
                Save as Draft
              </OcButton>
              <OcButton disabled={isSubmitting} onClick={() => handlePublish(true)}>
                {isSubmitting ? "Publishing..." : "Publish Campaign"}
              </OcButton>
            </div>
          )}
        </div>
      </OcCard>
    </div>
  );
}
