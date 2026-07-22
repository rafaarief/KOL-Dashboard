"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface Niche {
  id: string;
  name: string;
}

interface RateCardRow {
  deliverableType: string;
  price: string;
  negotiable: boolean;
}

const RATE_CARD_PRESETS = ["Instagram Story", "Instagram Feed", "Instagram Reels", "TikTok Video", "YouTube Video", "Event Appearance", "Package"];

interface PortfolioRow {
  title: string;
  mediaUrl: string;
  linkUrl: string;
}

interface BrandExperienceRow {
  brandName: string;
  description: string;
  year: string;
}

function OnboardKolForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outreachId = searchParams.get("outreachId") ?? undefined;

  const [niches, setNiches] = useState<Niche[]>([]);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    username: "",
    displayName: "",
    avatarUrl: "",
    city: "",
    province: "",
    bio: "",
    headline: "",
    languages: "Indonesian",
    yearsOfExperience: "",
    primaryNicheId: "",
    instagramUsername: "",
    instagramFollowers: "",
    tiktokUsername: "",
    tiktokFollowers: "",
    youtubeUsername: "",
    youtubeFollowers: "",
    acceptsPaid: true,
    acceptsBarter: false,
    acceptsAffiliate: false,
    acceptsAmbassador: false,
    acceptsEventAttendance: false,
    minimumBudget: "",
    availabilityStatus: "open",
  });
  const [rateCards, setRateCards] = useState<RateCardRow[]>(RATE_CARD_PRESETS.map((deliverableType) => ({ deliverableType, price: "", negotiable: false })));
  const [portfolioItems, setPortfolioItems] = useState<PortfolioRow[]>([{ title: "", mediaUrl: "", linkUrl: "" }]);
  const [brandExperiences, setBrandExperiences] = useState<BrandExperienceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ temporaryPassword: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/outreach/niches")
      .then((res) => (res.ok ? res.json() : { niches: [] }))
      .then((body) => setNiches(body.niches ?? []));
  }, []);

  useEffect(() => {
    if (!outreachId) return;
    fetch(`/api/admin/outreach/kols/${outreachId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!body?.outreach) return;
        const o = body.outreach;
        setForm((f) => ({
          ...f,
          email: o.email ?? "",
          phone: o.phone ?? "",
          displayName: o.kolName ?? "",
          city: o.city ?? "",
          instagramUsername: o.instagramUrl ? o.instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "") : "",
          instagramFollowers: o.instagramFollowers ? String(o.instagramFollowers) : "",
          tiktokUsername: o.tiktokUrl ? o.tiktokUrl.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/\/$/, "") : "",
          tiktokFollowers: o.tiktokFollowers ? String(o.tiktokFollowers) : "",
          primaryNicheId: o.primaryNicheId ?? "",
        }));
      });
  }, [outreachId]);

  function updateRateCard(index: number, patch: Partial<RateCardRow>) {
    setRateCards((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    const socialAccounts = [
      form.instagramUsername ? { platform: "instagram" as const, username: form.instagramUsername, followerCount: Number(form.instagramFollowers) || 0 } : null,
      form.tiktokUsername ? { platform: "tiktok" as const, username: form.tiktokUsername, followerCount: Number(form.tiktokFollowers) || 0 } : null,
      form.youtubeUsername ? { platform: "youtube" as const, username: form.youtubeUsername, followerCount: Number(form.youtubeFollowers) || 0 } : null,
    ].filter((s): s is NonNullable<typeof s> => s !== null);

    const body = {
      outreachId,
      email: form.email,
      phone: form.phone,
      username: form.username,
      displayName: form.displayName,
      avatarUrl: form.avatarUrl || undefined,
      city: form.city || undefined,
      province: form.province || undefined,
      bio: form.bio || undefined,
      headline: form.headline || undefined,
      languages: form.languages ? form.languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      primaryNicheId: form.primaryNicheId || undefined,
      socialAccounts,
      acceptsPaid: form.acceptsPaid,
      acceptsBarter: form.acceptsBarter,
      acceptsAffiliate: form.acceptsAffiliate,
      acceptsAmbassador: form.acceptsAmbassador,
      acceptsEventAttendance: form.acceptsEventAttendance,
      rateCards: rateCards
        .filter((r) => r.price || r.negotiable)
        .map((r) => ({ deliverableType: r.deliverableType, price: r.price ? Number(r.price) : undefined, visibility: r.negotiable ? ("negotiable" as const) : ("starting_from" as const) })),
      minimumBudget: form.minimumBudget ? Number(form.minimumBudget) : undefined,
      portfolioItems: portfolioItems.filter((p) => p.title.trim() !== ""),
      brandExperiences: brandExperiences
        .filter((b) => b.brandName.trim() !== "")
        .map((b) => ({ brandName: b.brandName, description: b.description || undefined, year: b.year ? Number(b.year) : undefined })),
      availabilityStatus: form.availabilityStatus,
    };

    const response = await fetch("/api/admin/outreach/onboard-kol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      setError(
        errBody.error === "EMAIL_TAKEN" ? "That email is already registered." : errBody.error === "USERNAME_TAKEN" ? "That username is already taken." : "Could not create this account. Check the fields and try again."
      );
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
          <p className="text-sm font-semibold text-oc-ink">KOL account created.</p>
          <p className="mt-2 text-sm text-oc-ink-muted">
            Share these login details with the KOL directly (WhatsApp/email) — never use your own email or phone for their account.
          </p>
          <div className="mt-4 space-y-1 rounded-oc border border-oc-border bg-oc-bg p-4 text-sm">
            <p>
              <span className="text-oc-ink-muted">Email:</span> {form.email}
            </p>
            <p>
              <span className="text-oc-ink-muted">Temporary password:</span> <span className="font-mono">{result.temporaryPassword}</span>
            </p>
          </div>
          <OcButton className="mt-4" onClick={() => router.push("/admin/outreach/kols")}>
            Back to KOL Outreach
          </OcButton>
        </OcCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-oc-ink">Manual KOL Onboarding</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">
        Use the KOL's own email and phone — never your own. They'll receive login details to continue editing themselves.
      </p>

      <div className="mt-6 space-y-5">
        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Account</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="KOL's email" required>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="KOL's phone" required>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Username" required>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Basic Info</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Profile photo URL">
              <input value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Province">
              <input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Headline">
              <input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Years of experience">
              <input type="number" min={0} value={form.yearsOfExperience} onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Languages (comma-separated)" className="sm:col-span-2">
              <input value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Bio" className="sm:col-span-2">
              <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Niche</p>
          <div className="mt-3">
            <select value={form.primaryNicheId} onChange={(e) => setForm((f) => ({ ...f, primaryNicheId: e.target.value }))} className={inputClass}>
              <option value="">Select primary niche</option>
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Social</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Instagram username">
              <input value={form.instagramUsername} onChange={(e) => setForm((f) => ({ ...f, instagramUsername: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Instagram followers">
              <input type="number" min={0} value={form.instagramFollowers} onChange={(e) => setForm((f) => ({ ...f, instagramFollowers: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="TikTok username">
              <input value={form.tiktokUsername} onChange={(e) => setForm((f) => ({ ...f, tiktokUsername: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="TikTok followers">
              <input type="number" min={0} value={form.tiktokFollowers} onChange={(e) => setForm((f) => ({ ...f, tiktokFollowers: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="YouTube username">
              <input value={form.youtubeUsername} onChange={(e) => setForm((f) => ({ ...f, youtubeUsername: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="YouTube followers">
              <input type="number" min={0} value={form.youtubeFollowers} onChange={(e) => setForm((f) => ({ ...f, youtubeFollowers: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Collaboration</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {(
              [
                ["acceptsPaid", "Paid"],
                ["acceptsBarter", "Barter"],
                ["acceptsAffiliate", "Affiliate"],
                ["acceptsAmbassador", "Ambassador"],
                ["acceptsEventAttendance", "Event / Brand visit"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Rate Card</p>
          <div className="mt-3 space-y-2">
            {rateCards.map((row, i) => (
              <div key={row.deliverableType} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 text-oc-ink-muted">{row.deliverableType}</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Rp"
                  value={row.price}
                  onChange={(e) => updateRateCard(i, { price: e.target.value })}
                  className="w-32 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm text-oc-ink"
                />
                <label className="flex items-center gap-1.5 text-xs text-oc-ink-muted">
                  <input type="checkbox" checked={row.negotiable} onChange={(e) => updateRateCard(i, { negotiable: e.target.checked })} />
                  Negotiable
                </label>
              </div>
            ))}
            <Field label="Minimum fee (Rp)" className="mt-2">
              <input type="number" min={0} value={form.minimumBudget} onChange={(e) => setForm((f) => ({ ...f, minimumBudget: e.target.value }))} className={`${inputClass} w-48`} />
            </Field>
          </div>
        </OcCard>

        <OcCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-oc-ink">Portfolio</p>
            <button type="button" onClick={() => setPortfolioItems((rows) => [...rows, { title: "", mediaUrl: "", linkUrl: "" }])} className="text-xs text-oc-700 hover:underline">
              + Add item
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {portfolioItems.map((item, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) => setPortfolioItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))}
                  className={inputClass}
                />
                <input
                  placeholder="Media URL"
                  value={item.mediaUrl}
                  onChange={(e) => setPortfolioItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, mediaUrl: e.target.value } : r)))}
                  className={inputClass}
                />
                <input
                  placeholder="Link URL"
                  value={item.linkUrl}
                  onChange={(e) => setPortfolioItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, linkUrl: e.target.value } : r)))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </OcCard>

        <OcCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-oc-ink">Brand Experience (optional)</p>
            <button type="button" onClick={() => setBrandExperiences((rows) => [...rows, { brandName: "", description: "", year: "" }])} className="text-xs text-oc-700 hover:underline">
              + Add brand
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {brandExperiences.map((row, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  placeholder="Brand name"
                  value={row.brandName}
                  onChange={(e) => setBrandExperiences((rows) => rows.map((r, idx) => (idx === i ? { ...r, brandName: e.target.value } : r)))}
                  className={inputClass}
                />
                <input
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) => setBrandExperiences((rows) => rows.map((r, idx) => (idx === i ? { ...r, description: e.target.value } : r)))}
                  className={inputClass}
                />
                <input
                  placeholder="Year"
                  type="number"
                  value={row.year}
                  onChange={(e) => setBrandExperiences((rows) => rows.map((r, idx) => (idx === i ? { ...r, year: e.target.value } : r)))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </OcCard>

        <OcCard className="p-5">
          <p className="text-sm font-semibold text-oc-ink">Availability</p>
          <select value={form.availabilityStatus} onChange={(e) => setForm((f) => ({ ...f, availabilityStatus: e.target.value }))} className={`${inputClass} mt-3`}>
            <option value="open">Open for Collaboration</option>
            <option value="limited">Limited Availability</option>
            <option value="fully_booked">Fully Booked</option>
            <option value="unavailable">Temporarily Unavailable</option>
          </select>
        </OcCard>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <OcButton disabled={isSubmitting || !form.email || !form.phone || !form.username || !form.displayName} onClick={submit}>
          {isSubmitting ? "Creating account..." : "Create KOL Account"}
        </OcButton>
      </div>
    </div>
  );
}

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

export default function OnboardKolPage() {
  return (
    <Suspense fallback={null}>
      <OnboardKolForm />
    </Suspense>
  );
}
