import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { CampaignCard } from "@/components/oc/CampaignCard";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { BrandCard } from "@/components/oc/BrandCard";
import { CountUp } from "@/components/oc/CountUp";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "Is OpenCollab.id free to use?",
    a: "Yes. Creating a creator or brand profile and publishing campaigns is free during this MVP phase. Future paid features (like featured placements) will be opt-in.",
  },
  {
    q: "How do payments work?",
    a: "OpenCollab.id doesn't process payments yet. Brands and creators agree on terms and settle payment directly, outside the platform.",
  },
  {
    q: "How do I get verified?",
    a: "Our admin team reviews verification requests submitted from your profile settings. Verified badges help build trust in the marketplace.",
  },
  {
    q: "Can a creator apply to multiple campaigns?",
    a: "Yes — creators can apply to as many open campaigns as they like, but only once per campaign.",
  },
];

export default async function LandingPage() {
  const db = getDb();

  const [featuredCampaigns, availableCreators, featuredBrands, stats] = await Promise.all([
    db
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
      })
      .from(schema.campaigns)
      .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
      .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
      .where(eq(schema.campaigns.status, "published"))
      .orderBy(desc(schema.campaigns.featured), desc(schema.campaigns.publishedAt))
      .limit(3),
    db
      .select({
        username: schema.creatorProfiles.username,
        displayName: schema.creatorProfiles.displayName,
        city: schema.creatorProfiles.city,
        avatarUrl: schema.creatorProfiles.avatarUrl,
        availabilityStatus: schema.creatorProfiles.availabilityStatus,
        verificationStatus: schema.creatorProfiles.verificationStatus,
        minimumBudget: schema.creatorProfiles.minimumBudget,
        slotsRemaining: schema.creatorProfiles.slotsRemaining,
        monthlyCapacity: schema.creatorProfiles.monthlyCapacity,
        primaryNicheName: schema.niches.name,
        totalFollowers: sql<number>`(select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa where csa.creator_profile_id = creator_profiles.id)`,
        featured: schema.creatorProfiles.featured,
      })
      .from(schema.creatorProfiles)
      .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
      .where(eq(schema.creatorProfiles.status, "active"))
      .orderBy(desc(schema.creatorProfiles.featured), desc(schema.creatorProfiles.createdAt))
      .limit(8),
    db
      .select({
        slug: schema.brandProfiles.slug,
        brandName: schema.brandProfiles.brandName,
        industry: schema.brandProfiles.industry,
        city: schema.brandProfiles.city,
        logoUrl: schema.brandProfiles.logoUrl,
        verificationStatus: schema.brandProfiles.verificationStatus,
        activeCampaignCount: sql<number>`(select count(*) from campaigns c where c.brand_profile_id = brand_profiles.id and c.status = 'published')`,
        featured: schema.brandProfiles.featured,
      })
      .from(schema.brandProfiles)
      .where(eq(schema.brandProfiles.status, "active"))
      .orderBy(desc(schema.brandProfiles.featured), desc(schema.brandProfiles.createdAt))
      .limit(6),
    Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.creatorProfiles),
      db.select({ count: sql<number>`count(*)` }).from(schema.brandProfiles),
      db.select({ count: sql<number>`count(*)` }).from(schema.campaigns).where(eq(schema.campaigns.status, "published")),
      db.select({ count: sql<number>`count(*)` }).from(schema.campaignApplications),
    ]),
  ]);

  const [[{ count: totalCreators }], [{ count: totalBrands }], [{ count: activeCampaigns }], [{ count: totalApplications }]] = stats;

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden rounded-oc-lg bg-oc-gradient px-6 py-14 text-center text-white sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Indonesia&apos;s Creator Collaboration Network</p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Find Brands. Find Creators. Collaborate Better.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/90">
          OpenCollab.id helps brands publish creator campaigns and helps creators discover transparent collaboration
          opportunities in one structured marketplace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/campaigns" className="rounded-oc-input bg-white px-6 py-2.5 text-sm font-semibold text-oc-700 hover:bg-oc-bg">
            Explore Campaigns
          </Link>
          <Link href="/register" className="rounded-oc-input border border-white/70 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Create Your Profile
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
          <Link href="/register/creator" className="rounded-full bg-white/15 px-4 py-1.5 hover:bg-white/25">
            I&apos;m a Creator
          </Link>
          <Link href="/register/brand" className="rounded-full bg-white/15 px-4 py-1.5 hover:bg-white/25">
            I&apos;m a Brand
          </Link>
        </div>
      </section>

      {/* Marketplace search */}
      <section className="mt-8">
        <form action="/marketplace" method="GET" className="flex gap-2">
          <input
            name="q"
            placeholder="Search campaigns, creators, brands, niches, or locations"
            className="w-full rounded-oc-input border border-oc-border bg-oc-card px-4 py-3 text-sm outline-none focus:border-oc-600"
          />
          <button type="submit" className="rounded-oc-input bg-oc-600 px-5 py-3 text-sm font-medium text-white hover:bg-oc-700">
            Search
          </button>
        </form>
      </section>

      {/* Platform stats */}
      <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Registered Creators", value: Number(totalCreators) },
          { label: "Registered Brands", value: Number(totalBrands) },
          { label: "Active Campaigns", value: Number(activeCampaigns) },
          { label: "Applications Submitted", value: Number(totalApplications) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-oc border border-oc-border bg-oc-card p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-oc-700">
              <CountUp value={stat.value} />
            </p>
            <p className="mt-1 text-xs text-oc-ink-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Featured campaigns */}
      {featuredCampaigns.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-oc-ink">Featured Campaigns</h2>
            <Link href="/campaigns" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCampaigns.map((c) => (
              <CampaignCard key={c.slug} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {/* Available creators */}
      {availableCreators.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-oc-ink">Available Creators</h2>
            <Link href="/creators" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {availableCreators.map((c) => (
              <CreatorCard key={c.username} creator={c} />
            ))}
          </div>
        </section>
      )}

      {/* Featured brands */}
      {featuredBrands.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-oc-ink">Featured Brands</h2>
            <Link href="/brands" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featuredBrands.map((b) => (
              <BrandCard key={b.slug} brand={b} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mt-16">
        <h2 className="text-center text-lg font-bold text-oc-ink">How OpenCollab Works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Create your profile", body: "Brands post their company info; creators publish rates, availability, and portfolio." },
            { step: "2", title: "Discover & apply", body: "Creators browse and apply to campaigns; brands browse and invite creators directly." },
            { step: "3", title: "Collaborate", body: "Agree on terms directly and bring the campaign to life — OpenCollab keeps the process structured." },
          ].map((item) => (
            <div key={item.step} className="rounded-oc border border-oc-border bg-oc-card p-6 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-oc-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <p className="mt-3 text-sm font-semibold text-oc-ink">{item.title}</p>
              <p className="mt-1 text-sm text-oc-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6">
          <h3 className="text-base font-semibold text-oc-ink">For Creators</h3>
          <ul className="mt-3 space-y-2 text-sm text-oc-ink-muted">
            <li>• Publish your rate card and availability once, reuse it everywhere</li>
            <li>• Apply to campaigns that match your niche and audience</li>
            <li>• Track every application status in one dashboard</li>
          </ul>
        </div>
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6">
          <h3 className="text-base font-semibold text-oc-ink">For Brands</h3>
          <ul className="mt-3 space-y-2 text-sm text-oc-ink-muted">
            <li>• Publish campaigns for free and reach relevant creators</li>
            <li>• Browse and directly invite creators that fit your brief</li>
            <li>• Shortlist, accept, or reject applicants from one place</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="text-lg font-bold text-oc-ink">Frequently Asked Questions</h2>
        <div className="mt-4 divide-y divide-oc-border rounded-oc border border-oc-border bg-oc-card">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group px-5 py-4">
              <summary className="cursor-pointer text-sm font-medium text-oc-ink">{faq.q}</summary>
              <p className="mt-2 text-sm text-oc-ink-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-14 rounded-oc-lg bg-oc-gradient px-6 py-12 text-center text-white">
        <h2 className="text-xl font-bold">Ready to collaborate?</h2>
        <p className="mt-2 text-sm text-white/90">Join OpenCollab.id today — it&apos;s free for both brands and creators.</p>
        <Link href="/register" className="mt-6 inline-block rounded-oc-input bg-white px-6 py-2.5 text-sm font-semibold text-oc-700 hover:bg-oc-bg">
          Join OpenCollab
        </Link>
      </section>

      <footer className="mt-14 border-t border-oc-border pt-8 text-xs text-oc-ink-muted">
        <div className="flex flex-wrap justify-between gap-4">
          <p>© {new Date().getFullYear()} OpenCollab.id — Where Brands Meet Creators.</p>
          <div className="flex gap-4">
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
