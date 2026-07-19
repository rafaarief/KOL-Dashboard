import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { OcCard } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <OcCard className="px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-oc-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-oc-ink">{value}</p>
    </OcCard>
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
        <p className="text-sm text-oc-ink-muted">We couldn&apos;t find your creator profile. Please contact support.</p>
      </OcCard>
    );
  }

  const [rateCardCount, portfolioCount, socialAccountCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorSocialAccounts).where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id)),
  ]);

  const applications = await db
    .select({ status: schema.campaignApplications.status })
    .from(schema.campaignApplications)
    .where(eq(schema.campaignApplications.creatorProfileId, profile.id));

  const [{ count: savedCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.savedCampaigns).where(eq(schema.savedCampaigns.userId, session.user.id));

  const completionChecks = [
    Boolean(profile.bio),
    Boolean(profile.city),
    Boolean(profile.primaryNicheId),
    Number(socialAccountCount[0].count) > 0,
    Number(rateCardCount[0].count) > 0,
    Number(portfolioCount[0].count) > 0,
  ];
  const completionPercent = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);

  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Welcome back, {profile.displayName}</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Here&apos;s how your creator profile is doing.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Profile Completion" value={`${completionPercent}%`} />
        <StatTile label="Availability" value={profile.availabilityStatus.replace("_", " ")} />
        <StatTile label="Applications Submitted" value={applications.length} />
        <StatTile label="Shortlisted" value={shortlisted} />
        <StatTile label="Accepted Campaigns" value={accepted} />
        <StatTile label="Saved Campaigns" value={Number(savedCount)} />
        <StatTile label="Monthly Slots" value={profile.slotsRemaining ?? "—"} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/creator/availability" className="rounded-oc-input border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg">
          Update availability
        </Link>
        <Link href="/dashboard/creator/portfolio" className="rounded-oc-input border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg">
          Add portfolio
        </Link>
        <Link href="/dashboard/creator/rates" className="rounded-oc-input border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg">
          Edit rate card
        </Link>
        <Link href="/campaigns" className="rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700">
          Browse campaigns
        </Link>
      </div>
    </div>
  );
}
