"use client";

import { signIn } from "next-auth/react";

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";

/** "Continue with Google" — renders nothing unless NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true, which
 * should only be set once GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are configured (see auth.ts).
 * `role` is only meaningful on the register pages: it tells the signIn callback whether a
 * brand-new Google sign-up should become a creator or brand account (see auth.ts's cookie read). */
export function GoogleSignInButton({ role, callbackUrl }: { role?: "creator" | "brand"; callbackUrl?: string }) {
  if (!GOOGLE_LOGIN_ENABLED) return null;

  function handleClick() {
    if (role) document.cookie = `oc_oauth_role=${role}; path=/; max-age=300; SameSite=Lax`;
    void signIn("google", { callbackUrl: callbackUrl ?? (role === "brand" ? "/dashboard/brand" : "/dashboard/creator") });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-oc-border bg-white px-4 py-2.5 text-sm font-medium text-oc-ink hover:bg-oc-bg"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.4 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16.3 3 9.7 7.5 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 40.5 16.3 45 24 45z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z" />
      </svg>
      Continue with Google
    </button>
  );
}
