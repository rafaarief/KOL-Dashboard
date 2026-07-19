"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OcButton } from "./primitives";

interface SocialAccountOption {
  id: string;
  platformName: string;
  username: string;
}

export function ApplyForm({ campaignId, socialAccounts }: { campaignId: string; socialAccounts: SocialAccountOption[] }) {
  const router = useRouter();
  const [pitch, setPitch] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState(socialAccounts[0]?.id ?? "");
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState("7");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "duplicate" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");

    const response = await fetch("/api/creator/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        pitch,
        proposedRate: proposedRate || undefined,
        selectedSocialAccountId: selectedSocialAccountId || undefined,
        estimatedDeliveryDays: estimatedDeliveryDays ? Number.parseInt(estimatedDeliveryDays, 10) : undefined,
        note: note || undefined,
        portfolioLinks: [],
      }),
    });

    if (response.status === 201) {
      setStatus("success");
      router.refresh();
      return;
    }
    if (response.status === 409) {
      setStatus("duplicate");
      return;
    }
    setStatus("error");
  }

  if (status === "success") {
    return (
      <div className="rounded-oc border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Application submitted! Track its status from your creator dashboard.
      </div>
    );
  }
  if (status === "duplicate") {
    return (
      <div className="rounded-oc border border-oc-border bg-oc-bg p-4 text-sm text-oc-ink-muted">
        You&apos;ve already applied to this campaign — check your dashboard for its status.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        required
        minLength={10}
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="Why are you a great fit for this campaign?"
        rows={3}
        className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm outline-none focus:border-oc-600"
      />
      {socialAccounts.length > 0 && (
        <select
          value={selectedSocialAccountId}
          onChange={(e) => setSelectedSocialAccountId(e.target.value)}
          className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
        >
          {socialAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.platformName} — @{account.username}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <input
          value={proposedRate}
          onChange={(e) => setProposedRate(e.target.value)}
          placeholder="Proposed rate (Rp)"
          className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
        />
        <input
          value={estimatedDeliveryDays}
          onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
          placeholder="Delivery (days)"
          className="w-1/2 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm"
        />
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
        rows={2}
        className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm outline-none focus:border-oc-600"
      />
      {status === "error" && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}
      <OcButton type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Submitting..." : "Submit Application"}
      </OcButton>
    </form>
  );
}
