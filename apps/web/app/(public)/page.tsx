import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { CampaignCard, type CampaignCardData } from "@/components/oc/CampaignCard";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { BrandCard } from "@/components/oc/BrandCard";
import { CountUp } from "@/components/oc/CountUp";
import { formatIDR } from "@/components/oc/primitives";
import { campaignVisualFor } from "@/lib/campaignVisuals";
import { kolSegmentSql } from "@/lib/kolSegment";

function heroBudgetLabel(c: CampaignCardData): string {
  if (c.budgetType === "barter") return "Barter";
  if (c.budgetType === "affiliate") return "Affiliate";
  if (c.budgetType === "negotiable") return "Negotiable";
  if (c.budgetPerCreator) return formatIDR(c.budgetPerCreator);
  if (c.budgetMin) return formatIDR(c.budgetMin);
  return "Negotiable";
}

const HERO_CARD_STYLES = [
  { tile: "bg-tile-mustard", rotate: "rotate-[6deg]", pos: "right-10 top-8", size: "w-[230px]" },
  { tile: "bg-tile-sky", rotate: "rotate-[-5deg]", pos: "left-2 top-[160px]", size: "w-[230px]" },
  { tile: "bg-tile-blush", rotate: "rotate-[3deg]", pos: "right-0 bottom-8", size: "w-[200px]" },
] as const;

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
        applicantCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
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
        acceptsBarter: schema.creatorProfiles.acceptsBarter,
        slotsRemaining: schema.creatorProfiles.slotsRemaining,
        monthlyCapacity: schema.creatorProfiles.monthlyCapacity,
        primaryNicheName: schema.niches.name,
        totalFollowers: sql<number>`(select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa where csa.creator_profile_id = creator_profiles.id)`,
        kolSegment: kolSegmentSql,
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
      <section className="relative grid gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-6">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-tile-lime px-4 py-1.5 text-xs font-semibold text-oc-ink">
            ✦ {Number(totalApplications).toLocaleString()}+ collabs closed
          </p>
          <h1 className="mt-5 max-w-lg font-display text-5xl font-extrabold leading-[1.05] text-oc-ink">
            Discover KOL
            <br />
            Collabs that fit.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-oc-ink-muted">
            Browse real campaigns from real brands, build a profile that sells itself, and get paid to create.
          </p>

          <form action="/marketplace" method="GET" className="mt-7 flex max-w-[420px] items-center gap-3 rounded-full bg-white p-2 pl-5 shadow-oc-sm">
            <input
              name="q"
              placeholder="Search campaigns, KOLs, brands..."
              className="w-full bg-transparent text-sm text-oc-ink placeholder:text-oc-subtle outline-none"
            />
            <button type="submit" className="shrink-0 rounded-full bg-oc-600 px-6 py-3 text-sm font-semibold text-white hover:bg-oc-700">
              Search
            </button>
          </form>

          <div className="mt-7 flex flex-wrap gap-3.5">
            <div className="rounded-2xl bg-tile-blush px-5 py-3.5">
              <p className="font-display text-xl font-extrabold text-oc-ink">{Number(totalCreators)}+</p>
              <p className="text-xs text-oc-ink-muted">KOLs</p>
            </div>
            <div className="rounded-2xl bg-tile-lavender px-5 py-3.5">
              <p className="font-display text-xl font-extrabold text-oc-ink">{Number(totalBrands)}+</p>
              <p className="text-xs text-oc-ink-muted">Brands</p>
            </div>
            <div className="rounded-2xl bg-tile-sky px-5 py-3.5">
              <p className="font-display text-xl font-extrabold text-oc-ink">
                <CountUp value={Number(activeCampaigns)} />
              </p>
              <p className="text-xs text-oc-ink-muted">Campaigns</p>
            </div>
          </div>
        </div>

        {/* Floating campaign-card collage */}
        <div className="relative z-10 hidden h-[440px] lg:block">
          {featuredCampaigns.slice(0, 3).map((c, i) => {
            const style = HERO_CARD_STYLES[i];
            const visual = campaignVisualFor(c.categoryName);
            const VisualIcon = visual.icon;
            return (
              <div
                key={c.slug}
                className={`absolute ${style.pos} ${style.size} ${style.rotate} ${style.tile} rounded-oc-lg p-4 shadow-oc`}
              >
                <Link href={`/campaigns/${c.slug}`} className="block h-[150px] w-full overflow-hidden rounded-oc-input bg-white/35">
                  {c.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImageUrl} alt={c.coverImageAlt || c.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <VisualIcon className="h-9 w-9 text-oc-ink/40" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  )}
                </Link>
                <p className="mt-3 line-clamp-1 text-[15px] font-bold text-oc-ink">{c.title}</p>
                <p className="mt-1 text-xs text-oc-ink-muted">
                  {c.brandName} &middot; {c.categoryName ?? "General"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-oc-ink">{heroBudgetLabel(c)}</span>
                  <Link href={`/campaigns/${c.slug}`} className="rounded-full bg-oc-dark px-3 py-1.5 text-xs font-semibold text-white">
                    Apply
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category filter pills */}
      <section className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-oc-dark px-5 py-2 text-sm font-semibold text-white">All</span>
        {["Beauty", "Fashion", "Tech", "F&B", "Travel"].map((cat) => (
          <Link
            key={cat}
            href={`/campaigns?category=${encodeURIComponent(cat)}`}
            className="rounded-full border border-oc-border bg-white px-5 py-2 text-sm font-semibold text-oc-ink hover:border-oc-600"
          >
            {cat}
          </Link>
        ))}
      </section>

      {/* Featured campaigns */}
      {featuredCampaigns.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-oc-ink">Featured Campaigns</h2>
            <Link href="/campaigns" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCampaigns.map((c, i) => (
              <CampaignCard key={c.slug} campaign={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Available creators */}
      {availableCreators.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-oc-ink">Available KOLs</h2>
            <Link href="/creators" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {availableCreators.map((c, i) => (
              <CreatorCard key={c.username} creator={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured brands */}
      {featuredBrands.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-oc-ink">Featured Brands</h2>
            <Link href="/brands" className="text-sm font-medium text-oc-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featuredBrands.map((b, i) => (
              <BrandCard key={b.slug} brand={b} index={i} />
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
            { step: "1", title: "Create your profile", body: "Brands post their company info; KOLs publish rates, availability, and portfolio.", tile: "bg-tile-blush" },
            { step: "2", title: "Discover & apply", body: "KOLs browse and apply to campaigns; brands browse and invite KOLs directly.", tile: "bg-tile-mustard" },
            { step: "3", title: "Collaborate", body: "Agree on terms directly and bring the campaign to life — OpenCollab keeps the process structured.", tile: "bg-tile-green" },
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
          <h3 className="mt-3 text-base font-bold text-oc-ink">For KOLs</h3>
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
      <section className="relative mt-14 overflow-hidden rounded-oc-xl bg-oc-600 px-6 py-12 text-center text-white">
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
          <p>© {new Date().getFullYear()} OpenCollab.id — Where Brands Meet KOLs.</p>
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
