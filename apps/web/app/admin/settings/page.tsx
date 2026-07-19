"use client";

import { useEffect, useState } from "react";
import { OcCard } from "@/components/oc/primitives";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  function load() {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((body) => setFlags(body.flags ?? []));
  }

  useEffect(load, []);

  async function toggle(key: string, enabled: boolean) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Platform Settings</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">
        Feature flags let future monetization (paid campaign posting, featured placements) roll out without a schema change.
      </p>

      <OcCard className="mt-4 divide-y divide-oc-border">
        {flags.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-oc-ink">{flag.key}</p>
              {flag.description && <p className="text-xs text-oc-ink-muted">{flag.description}</p>}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={flag.enabled} onChange={(e) => toggle(flag.key, e.target.checked)} />
              {flag.enabled ? "Enabled" : "Disabled"}
            </label>
          </div>
        ))}
        {flags.length === 0 && <p className="px-5 py-6 text-sm text-oc-ink-muted">No feature flags configured yet.</p>}
      </OcCard>
    </div>
  );
}
