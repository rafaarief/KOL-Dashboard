"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CampaignStatusBadge, OcCard, VerificationBadge } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface BrandDetail {
  profile: {
    id: string;
    slug: string;
    brandName: string;
    industry: string | null;
    city: string | null;
    description: string | null;
    website: string | null;
    email: string;
    userStatus: string;
    contactEmail: string | null;
    verificationStatus: string;
    status: string;
    featured: boolean;
    createdAt: string;
  };
  campaigns: { id: string; title: string; status: string; creatorCountAccepted: number; creatorCountNeeded: number; createdAt: string }[];
  reports: { id: string; reason: string; status: string; createdAt: string }[];
  stats: { totalApplicants: number; creatorsHired: number };
}

const ACTION_LABELS: Record<string, string> = {
  verify: "Brand verified.",
  reject_verification: "Verification rejected.",
  suspend: "Brand suspended.",
  reactivate: "Brand reactivated.",
  feature: "Brand featured.",
  unfeature: "Brand unfeatured.",
};

export default function AdminBrandDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<BrandDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/admin/brands/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: BrandDetail) => {
        setData(body);
        setForm({
          brandName: body.profile.brandName,
          city: body.profile.city ?? "",
          industry: body.profile.industry ?? "",
          description: body.profile.description ?? "",
          website: body.profile.website ?? "",
        });
      })
      .catch(() => showToast("Couldn't load this brand.", "error"));
  }

  useEffect(load, [params.id]);

  async function runAction(action: string) {
    const response = await fetch("/api/admin/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, action }),
    });
    showToast(response.ok ? ACTION_LABELS[action] ?? "Updated." : "That action failed.", response.ok ? "success" : "error");
    load();
  }

  async function saveEdits() {
    setSaving(true);
    const response = await fetch(`/api/admin/brands/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    showToast(response.ok ? "Brand updated." : "Save failed.", response.ok ? "success" : "error");
    load();
  }

  if (!data) return <p className="text-sm text-oc-ink-muted">Loading…</p>;
  const { profile } = data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-oc-ink">{profile.brandName}</h1>
            <VerificationBadge status={profile.verificationStatus} />
            {profile.featured && <span className="text-xs font-semibold text-oc-700">★ Featured</span>}
          </div>
          <p className="mt-1 text-sm text-oc-ink-muted">
            {profile.email} ·{" "}
            <Link href={`/brands/${profile.slug}`} className="text-oc-700 hover:underline" target="_blank">
              View public profile ↗
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button onClick={() => runAction("verify")} className="rounded border border-oc-border px-2.5 py-1.5 hover:bg-oc-bg">
            Verify
          </button>
          <button
            onClick={() => runAction(profile.status === "suspended" ? "reactivate" : "suspend")}
            className="rounded border border-oc-border px-2.5 py-1.5 hover:bg-oc-bg"
          >
            {profile.status === "suspended" ? "Reactivate" : "Suspend"}
          </button>
          <button onClick={() => runAction(profile.featured ? "unfeature" : "feature")} className="rounded border border-oc-border px-2.5 py-1.5 hover:bg-oc-bg">
            {profile.featured ? "Unfeature" : "Feature"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Edit brand</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs text-oc-ink-muted">
                Brand name
                <input
                  value={form.brandName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted">
                City
                <input
                  value={form.city ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted">
                Industry
                <input
                  value={form.industry ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted">
                Website
                <input
                  value={form.website ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted sm:col-span-2">
                Description
                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
            </div>
            <button
              onClick={saveEdits}
              disabled={saving}
              className="mt-3 rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Campaigns ({data.campaigns.length})</p>
            <div className="mt-3 divide-y divide-oc-border">
              {data.campaigns.map((c) => (
                <Link key={c.id} href={`/admin/campaigns/${c.id}`} className="flex items-center justify-between py-2 text-sm hover:bg-oc-bg">
                  <span>{c.title}</span>
                  <div className="flex items-center gap-2">
                    <CampaignStatusBadge status={c.status} />
                    <span className="text-xs text-oc-ink-muted">
                      {c.creatorCountAccepted}/{c.creatorCountNeeded}
                    </span>
                  </div>
                </Link>
              ))}
              {data.campaigns.length === 0 && <p className="py-2 text-sm text-oc-ink-muted">No campaigns yet.</p>}
            </div>
          </OcCard>

          {data.reports.length > 0 && (
            <OcCard className="p-5">
              <p className="text-sm font-semibold text-oc-ink">Reports ({data.reports.length})</p>
              <div className="mt-3 divide-y divide-oc-border">
                {data.reports.map((r) => (
                  <div key={r.id} className="py-2 text-sm">
                    <p className="text-oc-ink">{r.reason}</p>
                    <p className="text-xs text-oc-ink-muted">
                      {r.status} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </OcCard>
          )}
        </div>

        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Account status</dt>
                <dd>{profile.userStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Total applicants</dt>
                <dd>{data.stats.totalApplicants}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">KOLs hired</dt>
                <dd>{data.stats.creatorsHired}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Joined</dt>
                <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </OcCard>
        </div>
      </div>
    </div>
  );
}
