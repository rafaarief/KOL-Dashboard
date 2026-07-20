import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Pricing</h1>
      <p className="mt-2 text-sm text-oc-ink-muted">OpenCollab.id is free for both brands and creators during this MVP phase.</p>

      <div className="mt-8 rounded-oc-lg border border-oc-border bg-tile-mint p-6 shadow-oc-sm">
        <p className="font-display text-lg font-bold text-oc-ink">Free — for everyone, today</p>
        <ul className="mt-3 space-y-2 text-sm text-oc-ink-muted">
          <li>✓ Unlimited creator profiles</li>
          <li>✓ Unlimited campaign publication</li>
          <li>✓ Unlimited applications and invitations</li>
          <li>✓ No commission on collaborations</li>
        </ul>
        <Link href="/register" className="mt-6 inline-block rounded-full bg-oc-dark px-6 py-2.5 text-sm font-semibold text-white shadow-oc-sm hover:bg-black">
          Join Free
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-oc-ink">What might become paid later</h2>
        <p className="mt-2 text-sm text-oc-ink-muted">
          As OpenCollab.id grows, we may introduce optional paid features — a small fee (around Rp10,000) to publish a
          campaign, a collaboration success fee, featured campaign or creator placements, and paid verification review.
          None of these are active yet, and existing free functionality won&apos;t be taken away.
        </p>
      </div>
    </div>
  );
}
