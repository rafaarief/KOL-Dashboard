import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { Avatar, VerificationBadge, tileForSeed } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

async function loadBrand(slug: string) {
  const db = getDb();
  const [brand] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.slug, slug)).limit(1);
  return brand ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = await loadBrand(params.slug);
  if (!brand) return { title: "Brand not found" };

  const title = brand.brandName;
  const description = brand.description || `${brand.brandName} is a brand on OpenCollab.id, Indonesia's professional network for KOL collaborations.`;

  return {
    title,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: { title, description, url: `/brands/${brand.slug}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
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
      coverImageUrl: schema.campaigns.coverImageUrl,
      coverImageAlt: schema.campaigns.coverImageAlt,
      applicantCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
    })
    .from(schema.campaigns)
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(eq(schema.campaigns.brandProfileId, brand.id))
    .orderBy(desc(schema.campaigns.createdAt));

  const activeCampaigns = campaignRows.filter((c) => c.status === "published");
  const pastCampaigns = campaignRows.filter((c) => c.status !== "published");

  const [{ creatorsHired }] = (await db.execute(
    sql`select count(distinct ca.creator_profile_id)::int as "creatorsHired"
        from campaign_applications ca
        join campaigns c on c.id = ca.campaign_id
        where c.brand_profile_id = ${brand.id} and ca.status = 'accepted'`
  )) as unknown as { creatorsHired: number }[];

  // Real trust signals, not fabricated — derived from this brand's own applicant review
  // activity: how often they actually review applications (vs leaving creators on read),
  // and how quickly.
  const [responsiveness] = (await db.execute(
    sql`select
          count(*)::int as total,
          count(*) filter (where ca.status <> 'submitted')::int as reviewed,
          avg(extract(epoch from (ca.updated_at - ca.created_at)) / 86400) filter (where ca.status <> 'submitted') as avg_response_days
        from campaign_applications ca
        join campaigns c on c.id = ca.campaign_id
        where c.brand_profile_id = ${brand.id}`
  )) as unknown as { total: number; reviewed: number; avg_response_days: string | null }[];

  const reviewRate = responsiveness?.total ? Math.round((responsiveness.reviewed / responsiveness.total) * 100) : null;
  const avgResponseDays = responsiveness?.avg_response_days ? Math.round(Number(responsiveness.avg_response_days) * 10) / 10 : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.brandName,
    description: brand.description ?? undefined,
    url: brand.website ?? undefined,
    logo: brand.logoUrl ?? undefined,
    address: brand.city ? { "@type": "PostalAddress", addressLocality: brand.city, addressCountry: "ID" } : undefined,
  };

  return (
    <div>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className={`h-24 rounded-oc-lg ${tileForSeed(brand.slug)}`} aria-hidden="true" />
      <div className="-mt-10 flex items-end gap-4 px-2">
        <div className="rounded-full ring-4 ring-oc-bg">
          <Avatar name={brand.brandName} url={brand.logoUrl} size={72} />
        </div>
        <div className="pb-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-extrabold text-oc-ink">{brand.brandName}</h1>
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

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
          <p className="text-lg font-semibold text-oc-ink">{activeCampaigns.length}</p>
          <p className="text-xs text-oc-ink-muted">Active Campaigns</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
          <p className="text-lg font-semibold text-oc-ink">{pastCampaigns.length}</p>
          <p className="text-xs text-oc-ink-muted">Past Campaigns</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
          <p className="text-lg font-semibold text-oc-ink">{Number(creatorsHired ?? 0)}</p>
          <p className="text-xs text-oc-ink-muted">KOLs Hired</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
          <p className="text-lg font-semibold text-oc-ink">{reviewRate !== null ? `${reviewRate}%` : "—"}</p>
          <p className="text-xs text-oc-ink-muted">Applications Reviewed</p>
        </div>
        <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
          <p className="text-lg font-semibold text-oc-ink">{avgResponseDays !== null ? `~${avgResponseDays}d` : "—"}</p>
          <p className="text-xs text-oc-ink-muted">Avg. Response Time</p>
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
            {activeCampaigns.map((c, i) => (
              <CampaignCard key={c.slug} campaign={{ ...c, brandName: brand.brandName, brandLogoUrl: brand.logoUrl, brandVerification: brand.verificationStatus }} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
