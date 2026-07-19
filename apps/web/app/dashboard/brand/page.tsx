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

export default async function BrandOverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const db = getDb();
  const [profile] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.userId, session.user.id)).limit(1);

  if (!profile) {
    return (
      <OcCard className="p-6">
        <p className="text-sm text-oc-ink-muted">We couldn&apos;t find your brand profile. Please contact support.</p>
      </OcCard>
    );
  }

  const [{ activeCampaigns }] = await db
    .select({ activeCampaigns: sql<number>`count(*) filter (where status = 'published')` })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.brandProfileId, profile.id));
  const [{ draftCampaigns }] = await db
    .select({ draftCampaigns: sql<number>`count(*) filter (where status = 'draft')` })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.brandProfileId, profile.id));
  const applicantStatsRows = (await db.execute(
    sql`select count(*)::int as "totalApplicants",
               count(*) filter (where status = 'shortlisted')::int as shortlisted,
               count(*) filter (where status = 'accepted')::int as accepted
        from campaign_applications
        where campaign_id in (select id from campaigns where brand_profile_id = ${profile.id})`
  )) as unknown as { totalApplicants: number; shortlisted: number; accepted: number }[];
  const { totalApplicants, shortlisted, accepted } = applicantStatsRows[0] ?? { totalApplicants: 0, shortlisted: 0, accepted: 0 };
  const [{ count: savedCreatorsCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.savedCreators).where(eq(schema.savedCreators.userId, session.user.id));

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Welcome back, {profile.brandName}</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Here&apos;s your campaign activity at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Active Campaigns" value={Number(activeCampaigns)} />
        <StatTile label="Draft Campaigns" value={Number(draftCampaigns)} />
        <StatTile label="Total Applicants" value={Number(totalApplicants)} />
        <StatTile label="Shortlisted" value={Number(shortlisted)} />
        <StatTile label="Accepted Creators" value={Number(accepted)} />
        <StatTile label="Saved Creators" value={Number(savedCreatorsCount)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/brand/campaigns/new" className="rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700">
          Post Campaign
        </Link>
        <Link href="/creators" className="rounded-oc-input border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg">
          Browse Creators
        </Link>
        <Link href="/dashboard/brand/applicants" className="rounded-oc-input border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg">
          Review Applicants
        </Link>
      </div>
    </div>
  );
}
