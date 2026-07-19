import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-oc-ink">About OpenCollab.id</h1>
      <p className="mt-4 text-sm text-oc-ink-muted">
        OpenCollab.id is a collaboration marketplace connecting brands and creators across Indonesia. Brands publish
        campaigns describing the collaboration they need; creators publish their availability, rates, and portfolio
        so brands can find the right fit quickly.
      </p>
      <p className="mt-4 text-sm text-oc-ink-muted">
        This MVP is intentionally free and simple: no payments, no escrow, no AI matching. The goal is a clear,
        structured discovery layer — brands and creators still coordinate and settle payment directly, the way they
        already do today, just with a better way to find each other.
      </p>
    </div>
  );
}
