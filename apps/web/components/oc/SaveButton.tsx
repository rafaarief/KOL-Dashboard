"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function SaveButton({
  endpoint,
  targetId,
  initialSaved = false,
  label = "Save",
  variant = "light",
}: {
  endpoint: string;
  targetId: string;
  initialSaved?: boolean;
  label?: string;
  variant?: "light" | "dark";
}) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setBusy(true);
    const response = await fetch(endpoint, {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: targetId }),
    });
    if (response.ok) setSaved((prev) => !prev);
    setBusy(false);
  }

  const darkStyle = saved ? "border-oc-600 bg-oc-600/20 text-white" : "border-white/25 text-white hover:bg-white/10";
  const lightStyle = saved ? "border-oc-600 bg-oc-300/10 text-oc-700" : "border-oc-border text-oc-ink hover:bg-oc-bg";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`w-full rounded-full border px-4 py-3 text-sm font-semibold transition ${variant === "dark" ? darkStyle : lightStyle}`}
    >
      {saved ? "♥ Saved" : `♡ ${label}`}
    </button>
  );
}
