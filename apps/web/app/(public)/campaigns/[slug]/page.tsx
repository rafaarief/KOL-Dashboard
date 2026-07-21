import { and, desc, eq, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { auth } from "@/auth";
import { ApplyForm } from "@/components/oc/ApplyForm";
import { SaveButton } from "@/components/oc/SaveButton";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { ShareCampaignButton } from "@/components/oc/ShareProfileButton";
import { Avatar, VerificationBadge, formatIDR, tileForSeed } from "@/components/oc/primitives";
import { campaignVisualFor } from "@/lib/campaignVisuals";

export const dynamic = "force-dynamic";

async function loadCampaign(slug: string) {
  const db = getDb();
  const [campaign] = await db
    .select({
      id: schema.campaigns.id,
      brandProfileId: schema.campaigns.brandProfileId,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      shortDescription: schema.campaigns.shortDescription,
      fullDescription: schema.campaigns.fullDescription,
      status: schema.campaigns.status,
      city: schema.campaigns.city,
      isRemote: schema.campaigns.isRemote,
      budgetType: schema.campaigns.budgetType,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      compensationType: schema.campaigns.compensationType,
      deliverables: schema.campaigns.deliverables,
      requirements: schema.campaigns.requirements,
      minimumFollowers: schema.campaigns.minimumFollowers,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      contentDeadline: schema.campaigns.contentDeadline,
      publishedAt: schema.campaigns.publishedAt,
      campaignStartDate: schema.campaigns.campaignStartDate,
      campaignEndDate: schema.campaigns.campaignEndDate,
      categoryId: schema.campaigns.categoryId,
      categoryName: schema.marketplaceCategories.name,
      coverImageUrl: schema.campaigns.coverImageUrl,
      coverImageAlt: schema.campaigns.coverImageAlt,
      brandName: schema.brandProfiles.brandName,
      brandSlug: schema.brandProfiles.slug,
      brandLogoUrl: schema.brandProfiles.logoUrl,
      brandVerification: schema.brandProfiles.verificationStatus,
      brandDescription: schema.brandProfiles.description,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(eq(schema.campaigns.slug, slug))
    .limit(1);

  return campaign ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const campaign = await loadCampaign(params.slug);
  if (!campaign) return { title: "Campaign not found" };

  const ogImage = `/api/og/campaigns/${campaign.slug}`;

  return {
    title: campaign.title,
    description: campaign.shortDescription,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    openGraph: {
      title: campaign.title,
      description: campaign.shortDescription,
      url: `/campaigns/${campaign.slug}`,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: campaign.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description: campaign.shortDescription,
      images: [ogImage],
    },
  };
}

function budgetLabel(c: NonNullable<Awaited<ReturnType<typeof loadCampaign>>>): string {
  if (c.budgetType === "barter") return "Product Barter";
  if (c.budgetType === "affiliate") return "Affiliate Commission";
  if (c.budgetType === "negotiable") return "Negotiable";
  if (c.budgetPerCreator) return `${formatIDR(c.budgetPerCreator)} per creator`;
  if (c.budgetMin && c.budgetMax) return `${formatIDR(c.budgetMin)}–${formatIDR(c.budgetMax)}`;
  return "Negotiable";
}

export default async function CampaignDetailPage({ params }: { params: { slug: string } }) {
  const campaign = await loadCampaign(params.slug);
  if (!campaign || campaign.status !== "published") notFound();

  const db = getDb();
  const session = await auth();

  let socialAccounts: { id: string; platformName: string; username: string }[] = [];
  let alreadySaved = false;
  if (session?.user.role === "creator") {
    const [profile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, session.user.id)).limit(1);
    if (profile) {
      const accounts = await db
        .select({ id: schema.creatorSocialAccounts.id, platformName: schema.platforms.name, username: schema.creatorSocialAccounts.username })
        .from(schema.creatorSocialAccounts)
        .innerJoin(schema.platforms, eq(schema.platforms.id, schema.creatorSocialAccounts.platformId))
        .where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id));
      socialAccounts = accounts;

      const [saved] = await db
        .select()
        .from(schema.savedCampaigns)
        .where(and(eq(schema.savedCampaigns.userId, session.user.id), eq(schema.savedCampaigns.campaignId, campaign.id)))
        .limit(1);
      alreadySaved = Boolean(saved);
    }
  }

  const [brandTrust] = (await db.execute(
    sql`select
          count(distinct c.id) filter (where c.status in ('published','filled','closed'))::int as "campaignsPosted",
          count(distinct ca.creator_profile_id) filter (where ca.status = 'accepted')::int as "creatorsHired",
          count(ca.id)::int as "totalApplications",
          count(ca.id) filter (where ca.status <> 'submitted')::int as "reviewedApplications"
        from campaigns c
        left join campaign_applications ca on ca.campaign_id = c.id
        where c.brand_profile_id = ${campaign.brandProfileId}`
  )) as unknown as { campaignsPosted: number; creatorsHired: number; totalApplications: number; reviewedApplications: number }[];
  const brandReviewRate = brandTrust?.totalApplications ? Math.round((brandTrust.reviewedApplications / brandTrust.totalApplications) * 100) : null;

  const similarRaw = campaign.categoryId
    ? await db
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
          brandName: schema.brandProfiles.brandName,
          brandLogoUrl: schema.brandProfiles.logoUrl,
          brandVerification: schema.brandProfiles.verificationStatus,
          featured: schema.campaigns.featured,
          applicantCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
        })
        .from(schema.campaigns)
        .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
        .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
        .where(and(eq(schema.campaigns.categoryId, campaign.categoryId), eq(schema.campaigns.status, "published"), ne(schema.campaigns.id, campaign.id)))
        .orderBy(desc(schema.campaigns.publishedAt))
        .limit(3)
    : [];

  const visual = campaignVisualFor(campaign.categoryName);
  const VisualIcon = visual.icon;
  const slotsRemaining = Math.max(0, campaign.creatorCountNeeded - campaign.creatorCountAccepted);
  const deadlinePassed = Boolean(campaign.applicationDeadline && new Date(campaign.applicationDeadline) < new Date());
  const daysLeft = campaign.applicationDeadline
    ? Math.ceil((new Date(campaign.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const deliverables = Array.isArray(campaign.deliverables) ? (campaign.deliverables as string[]) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: campaign.title,
    description: campaign.fullDescription,
    datePosted: campaign.publishedAt ?? undefined,
    validThrough: campaign.applicationDeadline ?? undefined,
    employmentType: "CONTRACTOR",
    hiringOrganization: { "@type": "Organization", name: campaign.brandName },
    jobLocationType: campaign.isRemote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: campaign.isRemote ? { "@type": "Country", name: "ID" } : undefined,
    jobLocation: !campaign.isRemote && campaign.city ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: campaign.city, addressCountry: "ID" } } : undefined,
    baseSalary:
      campaign.budgetPerCreator || campaign.budgetMin
        ? {
            "@type": "MonetaryAmount",
            currency: "IDR",
            value: { "@type": "QuantitativeValue", value: campaign.budgetPerCreator ?? campaign.budgetMin, unitText: "MONTH" },
          }
        : undefined,
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div>
        <div className={`relative overflow-hidden rounded-oc-xl ${tileForSeed(campaign.slug)}`}>
          <div className="relative h-[280px] w-full sm:h-[340px]">
            {campaign.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.coverImageUrl} alt={campaign.coverImageAlt || campaign.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/25">
                <VisualIcon className="h-16 w-16 text-oc-ink/30" strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
            {campaign.categoryName && (
              <span className="absolute left-6 top-6 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-oc-ink">{campaign.categoryName}</span>
            )}
            {daysLeft !== null && !deadlinePassed && (
              <div className="absolute right-6 top-6 rounded-2xl bg-oc-dark px-4 py-2 text-center text-white">
                <p className="font-display text-lg font-extrabold leading-none">{Math.max(0, daysLeft).toString().padStart(2, "0")}</p>
                <p className="text-[10px] leading-none text-white/70">days left</p>
              </div>
            )}
            <h1 className="absolute inset-x-6 bottom-6 font-display text-2xl font-extrabold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-4xl">
              {campaign.title}
            </h1>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar name={campaign.brandName} url={campaign.brandLogoUrl} size={32} />
            <Link href={`/brands/${campaign.brandSlug}`} className="text-sm font-medium text-oc-ink hover:underline">
              {campaign.brandName}
            </Link>
            <VerificationBadge status={campaign.brandVerification} />
          </div>
          <ShareCampaignButton slug={campaign.slug} variant="link" />
        </div>

        <p className="mt-4 text-sm text-oc-ink-muted">{campaign.shortDescription}</p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">Campaign Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-oc-ink-muted">{campaign.fullDescription}</p>
        </section>

        {deliverables.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Deliverables</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {deliverables.map((item) => (
                <span key={item} className="rounded-full bg-oc-card px-4 py-2 text-xs font-semibold text-oc-ink shadow-oc-sm">
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {campaign.requirements && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">KOL Requirements</h2>
            <p className="mt-2 text-sm text-oc-ink-muted">{campaign.requirements}</p>
            {campaign.minimumFollowers && (
              <p className="mt-1 text-sm text-oc-ink-muted">Minimum followers: {campaign.minimumFollowers.toLocaleString()}</p>
            )}
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">Timeline</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-oc-ink-muted">Application deadline</p>
              <p className="font-medium text-oc-ink">
                {campaign.applicationDeadline ? new Date(campaign.applicationDeadline).toLocaleDateString() : "Rolling"}
              </p>
            </div>
            <div>
              <p className="text-xs text-oc-ink-muted">Content deadline</p>
              <p className="font-medium text-oc-ink">
                {campaign.contentDeadline ? new Date(campaign.contentDeadline).toLocaleDateString() : "TBD"}
              </p>
            </div>
            <div>
              <p className="text-xs text-oc-ink-muted">Location</p>
              <p className="font-medium text-oc-ink">{campaign.isRemote ? "Remote" : campaign.city ?? "On-site"}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-oc border border-oc-border bg-oc-bg p-4 text-xs text-oc-ink-muted">
          Campaign safety notice: OpenCollab.id does not process payments on your behalf yet. Confirm deliverables and
          payment terms directly with the brand before starting work, and never share sensitive account credentials.
        </div>

        {similarRaw.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-oc-ink">Similar Campaigns</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarRaw.map((c, i) => (
                <CampaignCard key={c.slug} campaign={c} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-oc-lg bg-oc-dark p-6 text-white">
          <p className="text-xs text-oc-dark-muted">Total Budget</p>
          <p className="font-display text-3xl font-extrabold">{budgetLabel(campaign)}</p>
          <p className="mt-1 text-xs text-oc-dark-muted">
            {slotsRemaining} of {campaign.creatorCountNeeded} KOL slots remaining
          </p>

          <div className="mt-5">
            {deadlinePassed ? (
              <p className="rounded-full border border-white/20 p-3 text-center text-xs text-oc-dark-muted">
                The application deadline for this campaign has passed.
              </p>
            ) : slotsRemaining <= 0 ? (
              <p className="rounded-full border border-white/20 p-3 text-center text-xs text-oc-dark-muted">
                This campaign has filled all of its KOL slots.
              </p>
            ) : !session ? (
              <Link href={`/login?next=/campaigns/${campaign.slug}`} className="block w-full rounded-full bg-oc-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-oc-700">
                Log in to Apply
              </Link>
            ) : session.user.role === "creator" ? (
              <ApplyForm campaignId={campaign.id} socialAccounts={socialAccounts} />
            ) : (
              <p className="rounded-full border border-white/20 p-3 text-center text-xs text-oc-dark-muted">
                Only KOL accounts can apply to campaigns.
              </p>
            )}
          </div>

          {session?.user.role === "creator" && (
            <div className="mt-3">
              <SaveButton endpoint="/api/creator/saved-campaigns" targetId={campaign.id} initialSaved={alreadySaved} label="Save Campaign" variant="dark" />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-oc-lg border border-oc-border bg-oc-card p-6 shadow-oc-sm">
          <div className="flex items-center gap-2">
            <Avatar name={campaign.brandName} url={campaign.brandLogoUrl} size={32} />
            <div>
              <p className="text-sm font-medium text-oc-ink">{campaign.brandName}</p>
              <VerificationBadge status={campaign.brandVerification} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
            <div>
              <p className="text-base font-semibold text-oc-ink">{brandTrust?.campaignsPosted ?? 0}</p>
              <p className="text-oc-ink-muted">Campaigns Posted</p>
            </div>
            <div>
              <p className="text-base font-semibold text-oc-ink">{brandTrust?.creatorsHired ?? 0}</p>
              <p className="text-oc-ink-muted">KOLs Hired</p>
            </div>
            <div>
              <p className="text-base font-semibold text-oc-ink">{brandReviewRate !== null ? `${brandReviewRate}%` : "—"}</p>
              <p className="text-oc-ink-muted">Applications Reviewed</p>
            </div>
            <div>
              <Link href={`/brands/${campaign.brandSlug}`} className="text-oc-700 hover:underline">
                View brand →
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
