"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { OcButton } from "@/components/oc/primitives";
import { GoogleSignInButton } from "@/components/oc/GoogleSignInButton";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  outreach_admin: "/admin/outreach",
  brand: "/dashboard/brand",
  creator: "/dashboard/creator",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setIsSubmitting(false);
      setError("Invalid email or password.");
      return;
    }

    // The generic /login form doesn't know the account's role up front — signIn({redirect:false})
    // only returns ok/error, not the session — so without this, every login landed on
    // /dashboard/creator regardless of role. Middleware then blocked brand/admin accounts from
    // that path and bounced them straight back to /login, which looked like login was broken.
    const session = await getSession();
    const role = session?.user?.role ?? "creator";
    const next = searchParams.get("next");
    router.push(next ?? ROLE_HOME[role] ?? "/dashboard/creator");
    router.refresh();
  }

  return (
    <div className="rounded-oc-lg border border-oc-border bg-oc-card p-8 shadow-oc">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oc-600 text-sm font-bold text-white">OC</span>
      <h1 className="mt-4 font-display text-xl font-extrabold text-oc-ink">Log in to OpenCollab</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Welcome back — brands and KOLs sign in here.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-oc-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-oc-ink">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border border-oc-border bg-oc-bg px-4 py-2.5 text-sm outline-none focus:border-oc-600"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <OcButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in..." : "Log In"}
        </OcButton>
      </form>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-sm text-oc-ink-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-oc-700 hover:underline">
          Join OpenCollab
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
