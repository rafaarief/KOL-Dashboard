"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OcButton, OcCard } from "@/components/oc/primitives";

const inputClass = "mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink";

function Field({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`text-xs text-oc-ink-muted ${className}`}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      {children}
    </label>
  );
}

function OnboardBrandForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outreachId = searchParams.get("outreachId") ?? undefined;

  const [form, setForm] = useState({
    email: "",
    picName: "",
    picPhone: "",
    brandName: "",
    industry: "",
    website: "",
    logoUrl: "",
    description: "",
    instagramUrl: "",
    tiktokUrl: "",
  });
  const [includeCampaign, setIncludeCampaign] = useState(false);
  const [campaign, setCampaign] = useState({ title: "", shortDescription: "", fullDescription: "", budgetType: "negotiable", budgetMin: "", budgetMax: "" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ temporaryPassword: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!outreachId) return;
    fetch(`/api/admin/outreach/brands/${outreachId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!body?.outreach) return;
        const o = body.outreach;
        setForm((f) => ({
          ...f,
          email: o.email ?? "",
          brandName: o.brandName ?? "",
          industry: o.industry ?? "",
          website: o.website ?? "",
          instagramUrl: o.instagramUrl ?? "",
          tiktokUrl: o.tiktokUrl ?? "",
        }));
      });
  }, [outreachId]);

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    const body = {
      outreachId,
      email: form.email,
      picName: form.picName,
      picPhone: form.picPhone,
      brandName: form.brandName,
      industry: form.industry || undefined,
      website: form.website || undefined,
      logoUrl: form.logoUrl || undefined,
      description: form.description || undefined,
      instagramUrl: form.instagramUrl || undefined,
      tiktokUrl: form.tiktokUrl || undefined,
      campaign: includeCampaign
        ? {
            title: campaign.title,
            shortDescription: campaign.shortDescription,
            fullDescription: campaign.fullDescription,
            budgetType: campaign.budgetType,
            budgetMin: campaign.budgetMin ? Number(campaign.budgetMin) : undefined,
            budgetMax: campaign.budgetMax ? Number(campaign.budgetMax) : undefined,
          }
        : undefined,
    };

    const response = await fetch("/api/admin/outreach/onboard-brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      setError(errBody.error === "EMAIL_TAKEN" ? "That email is already registered." : "Could not create this account. Check the fields and try again.");
      setIsSubmitting(false);
      return;
    }

    const resultBody = await response.json();
    setResult({ temporaryPassword: resultBody.temporaryPassword });
    setIsSubmitting(false);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl">
        <OcCard className="p-6">
          <p className="text-sm font-semibold text-oc-ink">Brand account created.</p>
          <p className="mt-2 text-sm text-oc-ink-muted">
            Share these login details with the brand's PIC directly — never use your own email or phone for their account.
          </p>
          <div className="mt-4 space-y-1 rounded-oc border border-oc-border bg-oc-bg p-4 text-sm">
            <p>
              <span className="text-oc-ink-muted">Email:</span> {form.email}
            </p>
            <p>
              <span className="text-oc-ink-muted">Temporary password:</span> <span className="font-mono">{result.temporaryPassword}</span>
            </p>
          </div>
          <OcButton className="mt-4" onClick={() => router.push("/admin/outreach/brands")}>
            Back to Brand Outreach
          </OcButton>
        </OcCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-oc-ink">Manual Brand Onboarding</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">
        Use the brand PIC's own email and phone — never your own. They'll receive login details to continue editing themselves.
      </p>

      <div className="mt-6 space-y-5">
        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Account &amp; PIC</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="PIC email" required>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="PIC phone" required>
              <input value={form.picPhone} onChange={(e) => setForm((f) => ({ ...f, picPhone: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="PIC name" required>
              <input value={form.picName} onChange={(e) => setForm((f) => ({ ...f, picName: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Company</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Brand name" required>
              <input value={form.brandName} onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Industry">
              <input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Logo URL">
              <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Instagram URL">
              <input value={form.instagramUrl} onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="TikTok URL">
              <input value={form.tiktokUrl} onChange={(e) => setForm((f) => ({ ...f, tiktokUrl: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-oc-ink">
            <input type="checkbox" checked={includeCampaign} onChange={(e) => setIncludeCampaign(e.target.checked)} />
            Create first campaign now (optional)
          </label>
          {includeCampaign && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Campaign title" required className="sm:col-span-2">
                <input value={campaign.title} onChange={(e) => setCampaign((c) => ({ ...c, title: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Short description" required className="sm:col-span-2">
                <input value={campaign.shortDescription} onChange={(e) => setCampaign((c) => ({ ...c, shortDescription: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Full description" required className="sm:col-span-2">
                <textarea rows={3} value={campaign.fullDescription} onChange={(e) => setCampaign((c) => ({ ...c, fullDescription: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Budget type">
                <select value={campaign.budgetType} onChange={(e) => setCampaign((c) => ({ ...c, budgetType: e.target.value }))} className={inputClass}>
                  <option value="fixed">Fixed</option>
                  <option value="range">Range</option>
                  <option value="barter">Barter Value</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </Field>
              <div />
              <Field label="Budget min (Rp)">
                <input type="number" min={0} value={campaign.budgetMin} onChange={(e) => setCampaign((c) => ({ ...c, budgetMin: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Budget max (Rp)">
                <input type="number" min={0} value={campaign.budgetMax} onChange={(e) => setCampaign((c) => ({ ...c, budgetMax: e.target.value }))} className={inputClass} />
              </Field>
            </div>
          )}
        </OcCard>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <OcButton
          disabled={
            isSubmitting ||
            !form.email ||
            !form.picPhone ||
            !form.picName ||
            !form.brandName ||
            (includeCampaign && (!campaign.title || !campaign.shortDescription || !campaign.fullDescription))
          }
          onClick={submit}
        >
          {isSubmitting ? "Creating account..." : "Create Brand Account"}
        </OcButton>
      </div>
    </div>
  );
}

export default function OnboardBrandPage() {
  return (
    <Suspense fallback={null}>
      <OnboardBrandForm />
    </Suspense>
  );
}
