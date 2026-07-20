import Link from "next/link";

export default function RegisterChoicePage() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Join OpenCollab.id</h1>
      <p className="mt-2 text-sm text-oc-ink-muted">Tell us who you are so we can set up the right profile.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/register/creator"
          className="rounded-oc-lg border border-oc-border bg-tile-blush p-8 text-left shadow-oc-sm transition hover:-translate-y-1 hover:shadow-oc"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg">🎨</span>
          <p className="mt-4 font-display text-lg font-bold text-oc-ink">I&apos;m a Creator</p>
          <p className="mt-1 text-sm text-oc-ink-muted">
            Publish your rate card and availability, browse campaigns, and apply to collaborations.
          </p>
        </Link>
        <Link
          href="/register/brand"
          className="rounded-oc-lg border border-oc-border bg-tile-sky p-8 text-left shadow-oc-sm transition hover:-translate-y-1 hover:shadow-oc"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg">🏢</span>
          <p className="mt-4 font-display text-lg font-bold text-oc-ink">I&apos;m a Brand</p>
          <p className="mt-1 text-sm text-oc-ink-muted">
            Post campaigns, browse creators, and manage applicants in one dashboard.
          </p>
        </Link>
      </div>
    </div>
  );
}
