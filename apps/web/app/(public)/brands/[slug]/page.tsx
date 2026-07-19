import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { Avatar, VerificationBadge } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

async function loadBrand(slug: string) {
  const db = getDb();
  const [brand] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.slug, slug)).limit(1);
  return brand ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = await loadBrand(params.slug);
  if (!brand) return { title: "Brand not found" };
  return { title: brand.brandName, description: brand.description ?? `${brand.brandName} on OpenCollab.id` };
}

export default async function BrandProfilePage({ params }: { params: { slug: string } }) {
  const brand = await loadBrand(params.slug);
  if (!brand || brand.status !== "active") notFound();

  const db = getDb();

  const campaignRows = await db
    .select({
      slug: schema.campaigns.slug,
      title: schema.campaigns.title,
      shortDescription: schema.campaigns.shortDescription,
      status: schema.campaigns.status,
      city: schema.campaigns.city,
      isRemote: schema.campaigns.isRemote,
      budgetType: schema.campaigns.budgetType,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      compensationType: schema.campaigns.compensationType,
      categoryName: schema.marketplaceCategories.name,
    })
    .from(schema.campaigns)
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(eq(schema.campaigns.brandProfileId, brand.id))
    .orderBy(desc(schema.campaigns.createdAt));

  const activeCampaigns = campaignRows.filter((c) => c.status === "published");
  const pastCampaigns = campaignRows.filter((c) => c.status !== "published");

  const [{ creatorsHired }] = await db.execute(
    sql`select count(distinct ca.creator_profile_id)::int as "creatorsHired"
        from campaign_applications ca
        join campaigns c on c.id = ca.campaign_id
        where c.brand_profile_id = ${brand.id} and ca.status = 'accepted'`
  ) as unknown as { creatorsHired: number }[];

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={brand.brandName} url={brand.logoUrl} size={72} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-oc-ink">{brand.brandName}</h1>
            <VerificationBadge status={brand.verificationStatus} />
          </div>
          <p className="text-sm text-oc-ink-muted">
            {brand.industry ?? "Brand"}
            {brand.city ? ` · ${brand.city}` : ""}
          </p>
        </div>
      </div>

      {brand.description && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">About</h2>
          <p className="mt-2 text-sm text-oc-ink-muted">{brand.description}</p>
        </section>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center">
          <p className="text-lg font-semibold text-oc-ink">{activeCampaigns.length}</p>
          <p className="text-xs text-oc-ink-muted">Active Campaigns</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center">
          <p className="text-lg font-semibold text-oc-ink">{pastCampaigns.length}</p>
          <p className="text-xs text-oc-ink-muted">Past Campaigns</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center">
          <p className="text-lg font-semibold text-oc-ink">{Number(creatorsHired ?? 0)}</p>
          <p className="text-xs text-oc-ink-muted">Creators Hired</p>
        </div>
      </div>

      {brand.contactVisible && brand.contactEmail && (
        <p className="mt-4 text-xs text-oc-ink-muted">Contact: {brand.contactEmail}</p>
      )}
      {brand.website && (
        <p className="mt-1 text-xs text-oc-ink-muted">
          Website:{" "}
          <a href={brand.website} target="_blank" rel="noreferrer" className="text-oc-700 hover:underline">
            {brand.website}
          </a>
        </p>
      )}

      {activeCampaigns.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-oc-ink">Active Campaigns</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((c) => (
              <CampaignCard key={c.slug} campaign={{ ...c, brandName: brand.brandName, brandLogoUrl: brand.logoUrl, brandVerification: brand.verificationStatus }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
