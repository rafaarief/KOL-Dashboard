"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface Niche {
  id: string;
  name: string;
}

interface Profile {
  displayName: string;
  city: string | null;
  bio: string | null;
  primaryNicheId: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactVisible: boolean;
}

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/creator/profile")
      .then((res) => res.json())
      .then((body) => {
        setProfile(body.profile);
        setNiches(body.niches ?? []);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setStatus("saving");
    await fetch("/api/creator/profile", {
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
      <h1 className="text-lg font-semibold text-oc-ink">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-oc-ink">Display name</label>
          <input
            value={profile.displayName}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">City</label>
          <input
            value={profile.city ?? ""}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Bio</label>
          <textarea
            rows={3}
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Primary niche</label>
          <select
            value={profile.primaryNicheId ?? ""}
            onChange={(e) => setProfile({ ...profile, primaryNicheId: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          >
            <option value="">Select a niche</option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Contact email</label>
          <input
            value={profile.contactEmail ?? ""}
            onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">WhatsApp</label>
          <input
            value={profile.contactWhatsapp ?? ""}
            onChange={(e) => setProfile({ ...profile, contactWhatsapp: e.target.value })}
            className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-oc-ink">
          <input
            type="checkbox"
            checked={profile.contactVisible}
            onChange={(e) => setProfile({ ...profile, contactVisible: e.target.checked })}
          />
          Show contact info publicly on my profile
        </label>

        <OcButton type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </OcButton>
      </form>
    </OcCard>
  );
}
