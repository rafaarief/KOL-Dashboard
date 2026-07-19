import Link from "next/link";

export default function RegisterChoicePage() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-2xl font-bold text-oc-ink">Join OpenCollab.id</h1>
      <p className="mt-2 text-sm text-oc-ink-muted">Tell us who you are so we can set up the right profile.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/register/creator"
          className="rounded-oc-lg border border-oc-border bg-oc-card p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-oc-ink">I&apos;m a Creator</p>
          <p className="mt-1 text-sm text-oc-ink-muted">
            Publish your rate card and availability, browse campaigns, and apply to collaborations.
          </p>
        </Link>
        <Link
          href="/register/brand"
          className="rounded-oc-lg border border-oc-border bg-oc-card p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-oc-ink">I&apos;m a Brand</p>
          <p className="mt-1 text-sm text-oc-ink-muted">
            Post campaigns, browse creators, and manage applicants in one dashboard.
          </p>
        </Link>
      </div>
    </div>
  );
}
