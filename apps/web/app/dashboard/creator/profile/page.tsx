"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";
import { ShareProfileButton } from "@/components/oc/ShareProfileButton";

interface Niche {
  id: string;
  name: string;
}

interface Profile {
  username: string;
  displayName: string;
  city: string | null;
  bio: string | null;
  headline: string | null;
  languages: string[];
  yearsOfExperience: number | null;
  primaryNicheId: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactVisible: boolean;
}

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [secondaryNicheIds, setSecondaryNicheIds] = useState<string[]>([]);
  const [languagesText, setLanguagesText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/creator/profile")
      .then((res) => res.json())
      .then((body) => {
        setProfile(body.profile);
        setNiches(body.niches ?? []);
        setSecondaryNicheIds(body.secondaryNicheIds ?? []);
        setLanguagesText((body.profile.languages ?? []).join(", "));
      });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setStatus("saving");
    const languages = languagesText
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    const response = await fetch("/api/creator/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, languages, secondaryNicheIds }),
    });
    setStatus(response.ok ? "saved" : "idle");
    showToast(response.ok ? "Professional profile updated." : "Couldn't save your changes — try again.", response.ok ? "success" : "error");
    setTimeout(() => setStatus("idle"), 2000);
  }

  function toggleSecondaryNiche(id: string) {
    setSecondaryNicheIds((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : prev.length < 5 ? [...prev, id] : prev));
  }

  if (!profile) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-oc-ink">Professional KOL Profile</h1>
        <ShareProfileButton username={profile.username} />
      </div>
      <p className="mt-1 text-sm text-oc-ink-muted">
        This is what brands see when they find you. Think of it as your resume — the more complete it is, the more it works for you.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        <OcCard className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Identity</p>
          <div>
            <label className="text-sm font-medium text-oc-ink">Display name</label>
            <input
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Professional headline</label>
            <input
              value={profile.headline ?? ""}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              placeholder="e.g. Lifestyle KOL • Jakarta • Photography"
              maxLength={120}
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-oc-ink-muted">Shown right under your name. Leave blank and we'll generate one from your niche and city.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Professional summary</label>
            <textarea
              rows={3}
              value={profile.bio ?? ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="What you make content about, who you make it for, and what makes your work distinct."
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
        </OcCard>

        <OcCard className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Specialization</p>
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
            <label className="text-sm font-medium text-oc-ink">Content categories (up to 5)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {niches
                .filter((n) => n.id !== profile.primaryNicheId)
                .map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => toggleSecondaryNiche(n.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      secondaryNicheIds.includes(n.id) ? "border-oc-600 bg-oc-300/10 text-oc-700" : "border-oc-border text-oc-ink-muted hover:bg-oc-bg"
                    }`}
                  >
                    {n.name}
                  </button>
                ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Languages</label>
            <input
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              placeholder="Bahasa Indonesia, English"
              className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-oc-ink-muted">Comma-separated.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Years of experience creating content</label>
            <input
              type="number"
              min={0}
              max={60}
              value={profile.yearsOfExperience ?? ""}
              onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-32 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
            />
          </div>
        </OcCard>

        <OcCard className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Contact</p>
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
        </OcCard>

        <OcButton type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </OcButton>
      </form>
    </div>
  );
}
