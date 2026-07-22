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
  description: "Search campaigns, KOLs, and brands in one place on OpenCollab.id.",
};

const TABS = [
  { value: "campaigns", label: "Campaigns" },
  { value: "creators", label: "KOLs" },
  { value: "brands", label: "Brands" },
] as const;

function str(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab = str(searchParams.tab) ?? "campaigns";
  const q = str(searchParams.q);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-oc-600">Search everything</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-oc-ink sm:text-3xl">Marketplace</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">One place to search campaigns, KOLs, and brands.</p>

      <form method="GET" className="mt-6 flex rounded-full border border-oc-border bg-oc-card p-1.5 shadow-oc-sm">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search campaigns, KOLs, brands, niches, or locations"
          className="w-full rounded-full bg-transparent px-4 py-2.5 text-sm outline-none"
        />
      </form>

      <div className="mt-6 flex gap-1 rounded-full bg-oc-border/50 p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/marketplace?tab=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
              tab === t.value ? "bg-oc-dark text-white shadow-oc-sm" : "text-oc-ink-muted hover:text-oc-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "creators" ? (
          <CreatorsTab
            q={q}
            segment={str(searchParams.segment)}
            feeType={str(searchParams.feeType)}
            minFee={str(searchParams.minFee)}
            maxFee={str(searchParams.maxFee)}
          />
        ) : tab === "brands" ? (
          <BrandsTab q={q} />
        ) : (
          <CampaignsTab
            q={q}
            budgetType={str(searchParams.budgetType)}
            minBudget={str(searchParams.minBudget)}
            maxBudget={str(searchParams.maxBudget)}
          />
        )}
      </div>
    </div>
  );
}

async function CampaignsTab({ q, budgetType, minBudget, maxBudget }: { q?: string; budgetType?: string; minBudget?: string; maxBudget?: string }) {
  const { rows, total } = await listPublishedCampaigns({ q, budgetType, minBudget, maxBudget });
  return (
    <>
      <p className="text-xs text-oc-ink-muted">{total.toLocaleString()} campaigns</p>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No campaigns matched" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c, i) => (
            <CampaignCard key={c.slug} campaign={c} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

async function CreatorsTab({
  q,
  segment,
  feeType,
  minFee,
  maxFee,
}: {
  q?: string;
  segment?: string;
  feeType?: string;
  minFee?: string;
  maxFee?: string;
}) {
  const { rows, total } = await listActiveCreators({ q, segment, feeType, minFee, maxFee });
  return (
    <>
      <p className="text-xs text-oc-ink-muted">{total.toLocaleString()} KOLs</p>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No KOLs matched" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((c, i) => (
            <CreatorCard key={c.username} creator={c} index={i} />
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
          {rows.map((b, i) => (
            <BrandCard key={b.slug} brand={b} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
