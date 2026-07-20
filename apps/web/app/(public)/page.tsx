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
      <section className="relative grid gap-10 overflow-hidden rounded-oc-xl bg-oc-mesh px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-6">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-oc-600 shadow-oc-sm">
            🇮🇩 Indonesia&apos;s Creator Collaboration Network
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.08] text-oc-ink sm:text-5xl">
            Find Brands. Find Creators.
            <span className="text-oc-600"> Collaborate</span> Better.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-oc-ink-muted">
            OpenCollab.id helps brands publish creator campaigns and helps creators discover transparent
            collaboration opportunities in one structured marketplace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/campaigns" className="rounded-full bg-oc-dark px-6 py-3 text-sm font-semibold text-white shadow-oc-sm hover:bg-black">
              Explore Campaigns →
            </Link>
            <Link href="/register" className="rounded-full border border-oc-ink/15 bg-white px-6 py-3 text-sm font-semibold text-oc-ink hover:bg-oc-bg">
              Create Your Profile
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            <Link href="/register/creator" className="rounded-full bg-white px-4 py-1.5 text-oc-700 shadow-oc-sm hover:bg-oc-bg">
              I&apos;m a Creator
            </Link>
            <Link href="/register/brand" className="rounded-full bg-white px-4 py-1.5 text-oc-700 shadow-oc-sm hover:bg-oc-bg">
              I&apos;m a Brand
            </Link>
          </div>
        </div>

        {/* Floating photo collage */}
        <div className="relative z-10 hidden h-[360px] lg:block">
          <div className="absolute right-14 top-2 h-40 w-32 -rotate-6 overflow-hidden rounded-oc-lg border-4 border-white shadow-oc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=70&auto=format&fit=crop"
              alt="Creator portrait"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute left-6 top-16 h-44 w-36 rotate-3 overflow-hidden rounded-oc-lg border-4 border-white shadow-oc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=70&auto=format&fit=crop"
              alt="Creator portrait"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 right-0 h-40 w-32 rotate-6 overflow-hidden rounded-oc-lg border-4 border-white shadow-oc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=70&auto=format&fit=crop"
              alt="Creator portrait"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute left-2 bottom-10 flex -rotate-3 items-center gap-3 rounded-oc-lg border border-oc-border bg-white p-3 shadow-oc">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=70&auto=format&fit=crop"
              alt="Brand representative"
              className="h-11 w-11 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-oc-ink-muted">Offered a collab</p>
              <p className="text-sm font-bold text-oc-ink">Rp 15,000,000</p>
            </div>
          </div>

          <div className="absolute right-8 top-40 rotate-2 rounded-oc-lg border border-oc-border bg-white px-4 py-3 shadow-oc">
            <p className="text-[11px] text-oc-ink-muted">Campaign slots</p>
            <p className="font-display text-lg font-extrabold text-oc-600">3 / 5 filled</p>
          </div>

          <span className="absolute -left-6 -top-10 h-24 w-24 rounded-full bg-tile-butter opacity-70 blur-2xl" />
          <span className="absolute bottom-0 right-16 h-28 w-28 rounded-full bg-tile-sky opacity-70 blur-2xl" />
        </div>
      </section>

      {/* Marketplace search */}
      <section className="mt-8">
        <form action="/marketplace" method="GET" className="flex gap-2 rounded-full border border-oc-border bg-oc-card p-1.5 shadow-oc-sm">
          <input
            name="q"
            placeholder="Search campaigns, creators, brands, niches, or locations"
            className="w-full rounded-full bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-oc-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-oc-700">
            Search
          </button>
        </form>
      </section>

      {/* Platform stats */}
      <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Registered Creators", value: Number(totalCreators), tile: "bg-tile-blush" },
          { label: "Registered Brands", value: Number(totalBrands), tile: "bg-tile-sky" },
          { label: "Active Campaigns", value: Number(activeCampaigns), tile: "bg-tile-butter" },
          { label: "Applications Submitted", value: Number(totalApplications), tile: "bg-tile-mint" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-oc-lg p-4 text-center ${stat.tile}`}>
            <p className="font-display text-2xl font-extrabold text-oc-ink">
              <CountUp value={stat.value} />
            </p>
            <p className="mt-1 text-xs font-medium text-oc-ink-muted">{stat.label}</p>
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
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-oc-600">The process</p>
        <h2 className="mt-1 text-center font-display text-2xl font-extrabold text-oc-ink">How OpenCollab Works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Create your profile", body: "Brands post their company info; creators publish rates, availability, and portfolio.", tile: "bg-tile-blush" },
            { step: "2", title: "Discover & apply", body: "Creators browse and apply to campaigns; brands browse and invite creators directly.", tile: "bg-tile-butter" },
            { step: "3", title: "Collaborate", body: "Agree on terms directly and bring the campaign to life — OpenCollab keeps the process structured.", tile: "bg-tile-mint" },
          ].map((item) => (
            <div key={item.step} className={`rounded-oc-lg p-6 text-center ${item.tile}`}>
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-oc-dark text-sm font-bold text-white">
                {item.step}
              </div>
              <p className="mt-3 text-sm font-bold text-oc-ink">{item.title}</p>
              <p className="mt-1 text-sm text-oc-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6 shadow-oc-sm">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-tile-blush text-base">🎨</span>
          <h3 className="mt-3 text-base font-bold text-oc-ink">For Creators</h3>
          <ul className="mt-3 space-y-2 text-sm text-oc-ink-muted">
            <li>• Publish your rate card and availability once, reuse it everywhere</li>
            <li>• Apply to campaigns that match your niche and audience</li>
            <li>• Track every application status in one dashboard</li>
          </ul>
        </div>
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6 shadow-oc-sm">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-tile-sky text-base">🏢</span>
          <h3 className="mt-3 text-base font-bold text-oc-ink">For Brands</h3>
          <ul className="mt-3 space-y-2 text-sm text-oc-ink-muted">
            <li>• Publish campaigns for free and reach relevant creators</li>
            <li>• Browse and directly invite creators that fit your brief</li>
            <li>• Shortlist, accept, or reject applicants from one place</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="font-display text-xl font-extrabold text-oc-ink">Frequently Asked Questions</h2>
        <div className="mt-4 divide-y divide-oc-border rounded-oc-lg border border-oc-border bg-oc-card">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold text-oc-ink">{faq.q}</summary>
              <p className="mt-2 text-sm text-oc-ink-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mt-14 overflow-hidden rounded-oc-xl bg-oc-gradient px-6 py-12 text-center text-white">
        <span className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
        <h2 className="relative font-display text-2xl font-extrabold">Ready to collaborate?</h2>
        <p className="relative mt-2 text-sm text-white/90">Join OpenCollab.id today — it&apos;s free for both brands and creators.</p>
        <Link href="/register" className="relative mt-6 inline-block rounded-full bg-oc-dark px-7 py-3 text-sm font-semibold text-white hover:bg-black">
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
