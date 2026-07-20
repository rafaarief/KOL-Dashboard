import Link from "next/link";
import type { Metadata } from "next";
import { listActiveBrands, listActiveCreators, listPublishedCampaigns } from "@/lib/marketplaceQueries";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { BrandCard } from "@/components/oc/BrandCard";
import { EmptyState } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Search campaigns, creators, and brands in one place on OpenCollab.id.",
};

const TABS = [
  { value: "campaigns", label: "Campaigns" },
  { value: "creators", label: "Creators" },
  { value: "brands", label: "Brands" },
] as const;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "campaigns";
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-oc-ink">Marketplace</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">One place to search campaigns, creators, and brands.</p>

      <form method="GET" className="mt-6">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search campaigns, creators, brands, niches, or locations"
          className="w-full rounded-oc-input border border-oc-border bg-oc-card px-4 py-3 text-sm outline-none focus:border-oc-600"
        />
      </form>

      <div className="mt-6 flex gap-2 border-b border-oc-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/marketplace?tab=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.value ? "border-oc-600 text-oc-700" : "border-transparent text-oc-ink-muted hover:text-oc-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "creators" ? (
          <CreatorsTab q={q} />
        ) : tab === "brands" ? (
          <BrandsTab q={q} />
        ) : (
          <CampaignsTab q={q} />
        )}
      </div>
    </div>
  );
}

async function CampaignsTab({ q }: { q?: string }) {
  const { rows, total } = await listPublishedCampaigns({ q });
  return (
    <>
      <p className="text-xs text-oc-ink-muted">{total.toLocaleString()} campaigns</p>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No campaigns matched" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <CampaignCard key={c.slug} campaign={c} />
          ))}
        </div>
      )}
    </>
  );
}

async function CreatorsTab({ q }: { q?: string }) {
  const { rows, total } = await listActiveCreators({ q });
  return (
    <>
      <p className="text-xs text-oc-ink-muted">{total.toLocaleString()} creators</p>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No creators matched" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((c) => (
            <CreatorCard key={c.username} creator={c} />
          ))}
        </div>
      )}
    </>
  );
}

async function BrandsTab({ q }: { q?: string }) {
  const { rows, total } = await listActiveBrands({ q });
  return (
    <>
      <p className="text-xs text-oc-ink-muted">{total.toLocaleString()} brands</p>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No brands matched" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((b) => (
            <BrandCard key={b.slug} brand={b} />
          ))}
        </div>
      )}
    </>
  );
}
