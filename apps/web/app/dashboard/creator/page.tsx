import Link from "next/link";
import { and, desc, eq, gt, notInArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { OcCard, VerificationBadge, tileAt } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

function StatTile({ label, value, index }: { label: string; value: number | string; index: number }) {
  return (
    <div className={`rounded-oc-lg px-5 py-4 ${tileAt(index)}`}>
      <p className="font-display text-2xl font-extrabold text-oc-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-oc-ink-muted">{label}</p>
    </div>
  );
}

export default async function CreatorOverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const db = getDb();
  const [profile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, session.user.id)).limit(1);

  if (!profile) {
    return (
      <OcCard className="p-6">
        <p className="text-sm text-oc-ink-muted">We couldn&apos;t find your KOL profile. Please contact support.</p>
      </OcCard>
    );
  }

  // All five independent (only `recommended` below genuinely depends on `applications`, via
  // appliedCampaignIds) — batched into one Promise.all instead of running as separate awaits.
  const [rateCardCount, portfolioCount, socialAccountCount, applications, [{ count: savedCount }]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorSocialAccounts).where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id)),
    db
      .select({ id: schema.campaignApplications.id, status: schema.campaignApplications.status, createdAt: schema.campaignApplications.createdAt })
      .from(schema.campaignApplications)
      .where(eq(schema.campaignApplications.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.savedCampaigns).where(eq(schema.savedCampaigns.userId, session.user.id)),
  ]);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todaysApplications = applications.filter((a) => new Date(a.createdAt) >= oneDayAgo).length;

  const appliedCampaignIds = applications.map((a) => a.id);
  const recommended = profile.primaryNicheId
    ? await db
        .select({
          slug: schema.campaigns.slug,
          title: schema.campaigns.title,
          brandName: schema.brandProfiles.brandName,
          budgetPerCreator: schema.campaigns.budgetPerCreator,
        })
        .from(schema.campaigns)
        .innerJoin(schema.campaignNiches, eq(schema.campaignNiches.campaignId, schema.campaigns.id))
        .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
        .where(
          and(
            eq(schema.campaigns.status, "published"),
            eq(schema.campaignNiches.nicheId, profile.primaryNicheId),
            appliedCampaignIds.length > 0 ? notInArray(schema.campaigns.id, appliedCampaignIds) : undefined,
            gt(schema.campaigns.creatorCountNeeded, schema.campaigns.creatorCountAccepted)
          )
        )
        .orderBy(desc(schema.campaigns.publishedAt))
        .limit(3)
    : [];

  const completionChecks: { label: string; done: boolean; href: string }[] = [
    { label: "Write a bio", done: Boolean(profile.bio), href: "/dashboard/creator/profile" },
    { label: "Set your city", done: Boolean(profile.city), href: "/dashboard/creator/profile" },
    { label: "Pick a primary niche", done: Boolean(profile.primaryNicheId), href: "/dashboard/creator/profile" },
    { label: "Link a social account", done: Number(socialAccountCount[0].count) > 0, href: "/dashboard/creator/profile" },
    { label: "Publish a rate card", done: Number(rateCardCount[0].count) > 0, href: "/dashboard/creator/rates" },
    { label: "Add a portfolio item", done: Number(portfolioCount[0].count) > 0, href: "/dashboard/creator/portfolio" },
  ];
  const completionPercent = Math.round((completionChecks.filter((c) => c.done).length / completionChecks.length) * 100);
  const nextSteps = completionChecks.filter((c) => !c.done);

  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const decided = accepted + rejected;
  const acceptanceRate = decided > 0 ? Math.round((accepted / decided) * 100) : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-oc-ink">Welcome back, {profile.displayName}</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">
        {todaysApplications > 0
          ? `${todaysApplications} application${todaysApplications === 1 ? "" : "s"} submitted in the last 24 hours.`
          : "Here's how your KOL profile is doing."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Profile Completion", value: `${completionPercent}%` },
          { label: "Availability", value: profile.availabilityStatus.replace("_", " ") },
          { label: "Applications Submitted", value: applications.length },
          { label: "Acceptance Rate", value: acceptanceRate !== null ? `${acceptanceRate}%` : "—" },
          { label: "Shortlisted", value: shortlisted },
          { label: "Accepted Campaigns", value: accepted },
          { label: "Saved Campaigns", value: Number(savedCount) },
          { label: "Monthly Slots", value: profile.slotsRemaining ?? "—" },
        ].map((s, i) => (
          <StatTile key={s.label} label={s.label} value={s.value} index={i} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OcCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-oc-ink">Verification</p>
            <VerificationBadge status={profile.verificationStatus} />
          </div>
          {profile.verificationStatus !== "verified" && (
            <p className="mt-2 text-xs text-oc-ink-muted">
              {profile.verificationStatus === "pending"
                ? "Your verification request is being reviewed by our team."
                : "A verified badge builds trust with brands. Contact support to request review."}
            </p>
          )}

          {nextSteps.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium text-oc-ink">Suggested improvements</p>
              <ul className="mt-2 space-y-1.5">
                {nextSteps.map((step) => (
                  <li key={step.label}>
                    <Link href={step.href} className="text-xs text-oc-700 hover:underline">
                      + {step.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </OcCard>

        <OcCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-oc-ink">Recommended for you</p>
            <Link href="/campaigns" className="text-xs text-oc-700 hover:underline">
              Browse all →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recommended.map((c) => (
              <Link key={c.slug} href={`/campaigns/${c.slug}`} className="block rounded-oc border border-oc-border px-3 py-2 text-sm hover:bg-oc-bg">
                <p className="font-medium text-oc-ink">{c.title}</p>
                <p className="text-xs text-oc-ink-muted">{c.brandName}</p>
              </Link>
            ))}
            {recommended.length === 0 && (
              <p className="text-xs text-oc-ink-muted">
                {profile.primaryNicheId
                  ? "No open campaigns in your niche right now — check back soon."
                  : "Set a primary niche on your profile to get campaign recommendations."}
              </p>
            )}
          </div>
        </OcCard>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {completionPercent < 100 ? (
          <Link href="/dashboard/creator/profile" className="rounded-full bg-oc-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-oc-700">
            Complete your profile
          </Link>
        ) : (
          <Link href="/campaigns" className="rounded-full bg-oc-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-oc-700">
            Browse campaigns
          </Link>
        )}
        <Link href="/dashboard/creator/availability" className="rounded-full border border-oc-border bg-oc-card px-5 py-2.5 text-sm font-semibold hover:bg-oc-bg">
          Update availability
        </Link>
        <Link href="/dashboard/creator/portfolio" className="rounded-full border border-oc-border bg-oc-card px-5 py-2.5 text-sm font-semibold hover:bg-oc-bg">
          Add portfolio
        </Link>
        <Link href="/dashboard/creator/rates" className="rounded-full border border-oc-border bg-oc-card px-5 py-2.5 text-sm font-semibold hover:bg-oc-bg">
          Edit rate card
        </Link>
      </div>
    </div>
  );
}
