import Link from "next/link";
import type { Metadata } from "next";
import { listActiveCreators } from "@/lib/marketplaceQueries";
import { withPage } from "@/lib/searchParamsHref";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { EmptyState } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Creators",
  description: "Discover TikTok, Instagram, and YouTube creators available for brand collaborations across Indonesia.",
};

export default async function CreatorsDirectoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    city: typeof searchParams.city === "string" ? searchParams.city : undefined,
    minFollowers: typeof searchParams.minFollowers === "string" ? searchParams.minFollowers : undefined,
    availability: typeof searchParams.availability === "string" ? searchParams.availability : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
  };

  const { rows, total, page, totalPages } = await listActiveCreators(params);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-oc-600">{total.toLocaleString()} creators</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Browse Creators</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Available for brand collaboration across Indonesia.</p>

      <form method="GET" className="mt-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name or username"
          className="w-64 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="city"
          defaultValue={params.city}
          placeholder="City"
          className="w-40 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="minFollowers"
          defaultValue={params.minFollowers}
          placeholder="Min followers"
          className="w-40 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <select name="availability" defaultValue={params.availability ?? ""} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="">Any availability</option>
          <option value="open">Open for Collaboration</option>
          <option value="limited">Limited Availability</option>
          <option value="fully_booked">Fully Booked</option>
        </select>
        <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="newest">Most recent</option>
          <option value="highest_followers">Highest followers</option>
          <option value="lowest_rate">Lowest minimum rate</option>
        </select>
        <button type="submit" className="rounded-full bg-oc-600 px-5 py-2 text-sm font-semibold text-white shadow-oc-sm hover:bg-oc-700">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No creators matched" description="Try clearing some filters." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((creator) => (
            <CreatorCard key={creator.username} creator={creator} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-sm text-oc-ink-muted">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link href={withPage(searchParams, Math.max(1, page - 1))} className={`rounded-full border border-oc-border px-4 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>
            Previous
          </Link>
          <Link href={withPage(searchParams, Math.min(totalPages, page + 1))} className={`rounded-full border border-oc-border px-4 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}>
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
