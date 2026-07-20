import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { listPublishedCampaigns } from "@/lib/marketplaceQueries";
import { withPage, withToggledParam } from "@/lib/searchParamsHref";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { EmptyState } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Campaigns",
  description: "Discover creator collaboration campaigns from brands across Indonesia.",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    city: typeof searchParams.city === "string" ? searchParams.city : undefined,
    minBudget: typeof searchParams.minBudget === "string" ? searchParams.minBudget : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
  };

  const [{ rows, total, page, totalPages }, categories] = await Promise.all([
    listPublishedCampaigns(params),
    getDb().select({ slug: schema.marketplaceCategories.slug, name: schema.marketplaceCategories.name }).from(schema.marketplaceCategories).orderBy(asc(schema.marketplaceCategories.name)),
  ]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-oc-600">{total.toLocaleString()} open campaigns</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Browse Campaigns</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">From brands across Indonesia.</p>

      <form method="GET" className="mt-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search campaigns"
          className="w-64 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="city"
          defaultValue={params.city}
          placeholder="City"
          className="w-40 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <input
          name="minBudget"
          defaultValue={params.minBudget}
          placeholder="Min budget (Rp)"
          className="w-40 rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm outline-none focus:border-oc-600"
        />
        <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-full border border-oc-border bg-oc-card px-4 py-2 text-sm">
          <option value="newest">Newest</option>
          <option value="highest_budget">Highest budget</option>
          <option value="closing_soon">Closing soon</option>
        </select>
        <button type="submit" className="rounded-full bg-oc-600 px-5 py-2 text-sm font-semibold text-white shadow-oc-sm hover:bg-oc-700">
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {categories.map((c) => {
          const active = params.category === c.slug;
          return (
            <Link
              key={c.slug}
              href={withToggledParam(searchParams, "category", c.slug)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active ? "border-oc-600 bg-oc-600 text-white" : "border-oc-border bg-oc-card text-oc-ink-muted hover:border-oc-400 hover:text-oc-ink"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
        {params.category && (
          <Link href={withToggledParam(searchParams, "category", params.category)} className="text-xs font-medium text-oc-ink-muted hover:underline">
            Clear filter
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No campaigns matched" description="Try clearing some filters." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((campaign) => (
            <CampaignCard key={campaign.slug} campaign={campaign} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-sm text-oc-ink-muted">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            href={withPage(searchParams, Math.max(1, page - 1))}
            className={`rounded-full border border-oc-border px-4 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <Link
            href={withPage(searchParams, Math.min(totalPages, page + 1))}
            className={`rounded-full border border-oc-border px-4 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
