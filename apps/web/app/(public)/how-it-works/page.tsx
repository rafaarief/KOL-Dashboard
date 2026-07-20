import type { Metadata } from "next";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">How OpenCollab Works</h1>

      <section className="mt-8 rounded-oc-lg border border-oc-border bg-tile-blush p-6 shadow-oc-sm">
        <h2 className="font-display text-lg font-bold text-oc-ink">🎨 For Creators</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-oc-ink-muted">
          <li>Create a free creator profile with your social accounts, rate card, and availability.</li>
          <li>Browse open campaigns filtered by niche, platform, budget, and location.</li>
          <li>Apply with a short pitch, your proposed rate, and relevant portfolio links.</li>
          <li>Track every application&apos;s status — submitted, viewed, shortlisted, accepted, or rejected.</li>
          <li>Accept invitations brands send you directly, or decline if it&apos;s not a fit.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-oc-lg border border-oc-border bg-tile-sky p-6 shadow-oc-sm">
        <h2 className="font-display text-lg font-bold text-oc-ink">🏢 For Brands</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-oc-ink-muted">
          <li>Create a free brand profile.</li>
          <li>Publish a campaign describing your scope of work, budget, and creator requirements.</li>
          <li>Review applicants as they come in, shortlist your favorites, and accept the best fits.</li>
          <li>Or browse the creator directory directly and invite creators who match your brief.</li>
          <li>Coordinate delivery and payment directly with your chosen creators.</li>
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-oc-ink">What OpenCollab.id doesn&apos;t do (yet)</h2>
        <p className="mt-3 text-sm text-oc-ink-muted">
          OpenCollab.id is an MVP marketplace, not a payments platform. We don&apos;t process payments, hold escrow, or
          calculate commissions automatically. Brands and creators agree on terms and settle payment directly, through
          whichever channel they already use.
        </p>
      </section>
    </div>
  );
}
