"use client";

import { useSession, signOut } from "next-auth/react";
import { OcButton, OcCard } from "@/components/oc/primitives";

export default function CreatorSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-oc-ink">Account Settings</h1>

      <OcCard className="mt-4 p-5">
        <p className="text-sm text-oc-ink-muted">Signed in as</p>
        <p className="text-sm font-medium text-oc-ink">{session?.user?.email}</p>
        <p className="mt-4 text-xs text-oc-ink-muted">
          Password changes and account deletion aren&apos;t self-service yet in this MVP — contact support if you need
          either.
        </p>
        <OcButton variant="secondary" className="mt-4" onClick={() => signOut({ callbackUrl: "/" })}>
          Log Out
        </OcButton>
      </OcCard>
    </div>
  );
}
