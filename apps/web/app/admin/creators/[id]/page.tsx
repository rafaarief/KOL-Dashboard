"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ApplicationStatusBadge,
  AvailabilityBadge,
  OcCard,
  VerificationBadge,
  formatIDR,
} from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface CreatorDetail {
  profile: {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    city: string | null;
    email: string;
    userStatus: string;
    avatarUrl: string | null;
    availabilityStatus: string;
    verificationStatus: string;
    status: string;
    featured: boolean;
    minimumBudget: string | null;
    contactEmail: string | null;
    yearsOfExperience: number | null;
    createdAt: string;
  };
  socialAccounts: { id: string; username: string; followerCount: number }[];
  rateCards: { id: string; deliverableType: string; price: string | null }[];
  portfolioItems: { id: string; title: string }[];
  brandExperiences: { id: string; brandName: string }[];
  applications: { id: string; status: string; createdAt: string; campaignTitle: string; campaignId: string }[];
  reports: { id: string; reason: string; status: string; createdAt: string }[];
}

const ACTION_LABELS: Record<string, string> = {
  verify: "KOL verified.",
  reject_verification: "Verification rejected.",
  suspend: "KOL suspended.",
  reactivate: "KOL reactivated.",
  feature: "KOL featured.",
  unfeature: "KOL unfeatured.",
};

export default function AdminCreatorDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<CreatorDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/admin/creators/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: CreatorDetail) => {
        setData(body);
        setForm({
          displayName: body.profile.displayName,
          city: body.profile.city ?? "",
          headline: body.profile.headline ?? "",
          bio: body.profile.bio ?? "",
        });
      })
      .catch(() => showToast("Couldn't load this KOL.", "error"));
  }

  useEffect(load, [params.id]);

  async function runAction(action: string) {
    const response = await fetch("/api/admin/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, action }),
    });
    showToast(response.ok ? ACTION_LABELS[action] ?? "Updated." : "That action failed.", response.ok ? "success" : "error");
    load();
  }

  async function saveEdits() {
    setSaving(true);
    const response = await fetch(`/api/admin/creators/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    showToast(response.ok ? "Profile updated." : "Save failed.", response.ok ? "success" : "error");
    load();
  }

  if (!data) return <p className="text-sm text-oc-ink-muted">Loading…</p>;
  const { profile } = data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-oc-ink">{profile.displayName}</h1>
            <VerificationBadge status={profile.verificationStatus} />
            {profile.featured && <span className="text-xs font-semibold text-oc-700">★ Featured</span>}
          </div>
          <p className="mt-1 text-sm text-oc-ink-muted">
            @{profile.username} · {profile.email} ·{" "}
            <Link href={`/creators/${profile.username}`} className="text-oc-700 hover:underline" target="_blank">
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
            <p className="text-sm font-semibold text-oc-ink">Edit profile</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs text-oc-ink-muted">
                Display name
                <input
                  value={form.displayName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
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
              <label className="text-xs text-oc-ink-muted sm:col-span-2">
                Headline
                <input
                  value={form.headline ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted sm:col-span-2">
                Bio
                <textarea
                  rows={3}
                  value={form.bio ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
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
            <p className="text-sm font-semibold text-oc-ink">Applications ({data.applications.length})</p>
            <div className="mt-3 divide-y divide-oc-border">
              {data.applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{a.campaignTitle}</span>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={a.status} />
                    <span className="text-xs text-oc-ink-muted">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {data.applications.length === 0 && <p className="py-2 text-sm text-oc-ink-muted">No applications yet.</p>}
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
                <dt className="text-oc-ink-muted">Availability</dt>
                <dd>
                  <AvailabilityBadge status={profile.availabilityStatus} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Account status</dt>
                <dd>{profile.userStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Min. budget</dt>
                <dd>{profile.minimumBudget ? formatIDR(profile.minimumBudget) : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Years experience</dt>
                <dd>{profile.yearsOfExperience ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Joined</dt>
                <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Social accounts ({data.socialAccounts.length})</p>
            <ul className="mt-2 space-y-1 text-sm text-oc-ink-muted">
              {data.socialAccounts.map((s) => (
                <li key={s.id}>
                  @{s.username} · {s.followerCount.toLocaleString()} followers
                </li>
              ))}
              {data.socialAccounts.length === 0 && <li>None linked.</li>}
            </ul>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Portfolio ({data.portfolioItems.length}) · Rate cards ({data.rateCards.length})</p>
            <p className="mt-2 text-xs text-oc-ink-muted">Brand experience: {data.brandExperiences.length} entries.</p>
          </OcCard>
        </div>
      </div>
    </div>
  );
}
