"use client";

import { useState } from "react";
import { useToast } from "./Toast";

/** The single most important growth surface in the product: makes it trivial to copy or
 * natively share a public URL (profile, campaign, brand). Falls back to clipboard copy when
 * the Web Share API isn't available (desktop browsers). */
export function ShareButton({
  path,
  shareTitle,
  label,
  copiedLabel,
  variant = "button",
}: {
  path: string;
  shareTitle: string;
  label: string;
  copiedLabel: string;
  variant?: "button" | "link";
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  function targetUrl() {
    const base = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "https://opencollab.id";
    return `${base}${path}`;
  }

  async function handleShare() {
    const url = targetUrl();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // User cancelled the native share sheet — not an error, just fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy the link — copy it from your address bar instead.", "error");
    }
  }

  if (variant === "link") {
    return (
      <button type="button" onClick={handleShare} className="text-sm font-medium text-oc-700 hover:underline">
        {copied ? copiedLabel : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-oc-input border border-oc-600 px-4 py-2 text-sm font-medium text-oc-600 hover:bg-oc-300/10"
    >
      {copied ? `✓ ${copiedLabel}` : `🔗 ${label}`}
    </button>
  );
}

export function ShareProfileButton({ username, variant = "button" }: { username: string; variant?: "button" | "link" }) {
  return (
    <ShareButton
      path={`/creators/${username}`}
      shareTitle="My OpenCollab profile"
      label="Share Profile"
      copiedLabel="Copied"
      variant={variant}
    />
  );
}

export function ShareCampaignButton({ slug, variant = "button" }: { slug: string; variant?: "button" | "link" }) {
  return (
    <ShareButton
      path={`/campaigns/${slug}`}
      shareTitle="Check out this collaboration on OpenCollab"
      label="Share Campaign"
      copiedLabel="Copied"
      variant={variant}
    />
  );
}
