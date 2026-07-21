"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { OcButton } from "@/components/oc/primitives";

export default function RegisterCreatorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "creator" }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(
        body.error === "EMAIL_TAKEN"
          ? "That email is already registered."
          : body.error === "USERNAME_TAKEN"
            ? "That username is already taken."
            : "Could not create your account. Check your details and try again."
      );
      setIsSubmitting(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setIsSubmitting(false);
    router.push("/dashboard/creator");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-oc-lg border border-oc-border bg-oc-card p-8 shadow-oc">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tile-blush text-lg">🎨</span>
        <h1 className="mt-4 font-display text-xl font-extrabold text-oc-ink">Create your KOL profile</h1>
        <p className="mt-1 text-sm text-oc-ink-muted">Free to join — publish your rate card and start applying to campaigns.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-oc-ink">Full name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Username</label>
            <input
              required
              minLength={3}
              placeholder="nadiadaily"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-oc-ink">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <OcButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create KOL Account"}
          </OcButton>
        </form>
      </div>
    </div>
  );
}
