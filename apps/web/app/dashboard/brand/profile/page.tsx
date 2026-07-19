"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface Profile {
  brandName: string;
  industry: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  contactEmail: string | null;
  contactVisible: boolean;
}

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/brand/profile")
      .then((res) => res.json())
      .then((body) => setProfile(body.profile));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setStatus("saving");
    await fetch("/api/brand/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  if (!profile) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <OcCard className="max-w-xl p-6">
      <h1 className="text-lg font-semibold text-oc-ink">Edit Brand Profile</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-oc-ink">Brand name</label>
          <input value={profile.brandName} onChange={(e) => setProfile({ ...profile, brandName: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Industry</label>
          <input value={profile.industry ?? ""} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">City</label>
          <input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Description</label>
          <textarea rows={3} value={profile.description ?? ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Website</label>
          <input value={profile.website ?? ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Contact email</label>
          <input value={profile.contactEmail ?? ""} onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })} className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm text-oc-ink">
          <input type="checkbox" checked={profile.contactVisible} onChange={(e) => setProfile({ ...profile, contactVisible: e.target.checked })} />
          Show contact info publicly on my brand page
        </label>
        <OcButton type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </OcButton>
      </form>
    </OcCard>
  );
}
