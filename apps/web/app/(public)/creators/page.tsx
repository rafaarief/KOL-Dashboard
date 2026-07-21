import Link from "next/link";
import type { Metadata } from "next";
import { listActiveCreators } from "@/lib/marketplaceQueries";
import { withPage } from "@/lib/searchParamsHref";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { EmptyState } from "@/components/oc/primitives";
import { KOL_SEGMENT_LABELS, KOL_SEGMENTS } from "@/lib/kolSegment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse KOLs",
  description: "Discover TikTok, Instagram, and YouTube KOLs available for brand collaborations across Indonesia.",
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
    segment: typeof searchParams.segment === "string" ? searchParams.segment : undefined,
    feeType: typeof searchParams.feeType === "string" ? searchParams.feeType : undefined,
    minFee: typeof searchParams.minFee === "string" ? searchParams.minFee : undefined,
    maxFee: typeof searchParams.maxFee === "string" ? searchParams.maxFee : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
  };

  const { rows, total, page, totalPages } = await listActiveCreators(params);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-oc-600">{total.toLocaleString()} KOLs</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Browse KOLs</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Available for brand collaboration across Indonesia.</p>

      <form method="GET" className="mt-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name, city, niche, or bio"
          className="w-64 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="city"
          defaultValue={params.city}
          placeholder="City"
          className="w-40 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <select name="segment" defaultValue={params.segment ?? ""} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="">Any segment</option>
          {KOL_SEGMENTS.map((seg) => (
            <option key={seg} value={seg}>
              {KOL_SEGMENT_LABELS[seg]}
            </option>
          ))}
        </select>
        <input
          name="minFollowers"
          defaultValue={params.minFollowers}
          placeholder="Min followers"
          className="w-36 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <select name="availability" defaultValue={params.availability ?? ""} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="">Any availability</option>
          <option value="open">Open for Collaboration</option>
          <option value="limited">Limited Availability</option>
          <option value="fully_booked">Fully Booked</option>
        </select>
        <select name="feeType" defaultValue={params.feeType ?? ""} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="">Fee or barter</option>
          <option value="paid">Has a KOL fee</option>
          <option value="barter">Open for Barter Value</option>
        </select>
        <input
          name="minFee"
          defaultValue={params.minFee}
          placeholder="Min fee (Rp)"
          className="w-36 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="maxFee"
          defaultValue={params.maxFee}
          placeholder="Max fee (Rp)"
          className="w-36 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
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
          <EmptyState title="No KOLs matched" description="Try clearing some filters." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((creator, i) => (
            <CreatorCard key={creator.username} creator={creator} index={i} />
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
