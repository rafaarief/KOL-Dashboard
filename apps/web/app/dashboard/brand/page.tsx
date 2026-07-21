import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { ApplicationStatusBadge, Avatar, OcCard, tileAt } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

function StatTile({ label, value, index }: { label: string; value: number | string; index: number }) {
  return (
    <div className={`rounded-oc-lg px-5 py-4 ${tileAt(index)}`}>
      <p className="font-display text-2xl font-extrabold text-oc-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-oc-ink-muted">{label}</p>
    </div>
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
               count(*) filter (where status = 'submitted')::int as "pendingReview",
               count(*) filter (where status = 'shortlisted')::int as shortlisted,
               count(*) filter (where status = 'accepted')::int as accepted,
               count(*) filter (where created_at >= now() - interval '24 hours')::int as "today"
        from campaign_applications
        where campaign_id in (select id from campaigns where brand_profile_id = ${profile.id})`
  )) as unknown as { totalApplicants: number; pendingReview: number; shortlisted: number; accepted: number; today: number }[];
  const { totalApplicants, pendingReview, shortlisted, accepted, today } = applicantStatsRows[0] ?? {
    totalApplicants: 0,
    pendingReview: 0,
    shortlisted: 0,
    accepted: 0,
    today: 0,
  };
  const [{ count: savedCreatorsCount }] = await db.select({ count: sql<number>`count(*)` }).from(schema.savedCreators).where(eq(schema.savedCreators.userId, session.user.id));

  const recentApplicants = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      createdAt: schema.campaignApplications.createdAt,
      campaignId: schema.campaigns.id,
      campaignTitle: schema.campaigns.title,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
      creatorAvatarUrl: schema.creatorProfiles.avatarUrl,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(eq(schema.campaigns.brandProfileId, profile.id))
    .orderBy(sql`${schema.campaignApplications.createdAt} desc`)
    .limit(5);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-oc-ink">Welcome back, {profile.brandName}</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">
        {today > 0 ? `${today} new application${today === 1 ? "" : "s"} in the last 24 hours.` : "Here's your campaign activity at a glance."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Campaigns", value: Number(activeCampaigns) },
          { label: "Draft Campaigns", value: Number(draftCampaigns) },
          { label: "Total Applicants", value: Number(totalApplicants) },
          { label: "Pending Review", value: Number(pendingReview) },
          { label: "Shortlisted", value: Number(shortlisted) },
          { label: "Accepted Creators", value: Number(accepted) },
          { label: "Saved Creators", value: Number(savedCreatorsCount) },
        ].map((s, i) => (
          <StatTile key={s.label} label={s.label} value={s.value} index={i} />
        ))}
      </div>

      <div className="mt-6">
        <OcCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-oc-ink">Recently active creators</p>
            <Link href="/dashboard/brand/applicants" className="text-xs text-oc-700 hover:underline">
              Review all →
            </Link>
          </div>
          <div className="mt-3 divide-y divide-oc-border">
            {recentApplicants.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/brand/campaigns/${a.campaignId}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-oc-bg"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={a.creatorDisplayName} url={a.creatorAvatarUrl} size={28} />
                  <div>
                    <p className="font-medium text-oc-ink">{a.creatorDisplayName}</p>
                    <p className="text-xs text-oc-ink-muted">applied to {a.campaignTitle}</p>
                  </div>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </Link>
            ))}
            {recentApplicants.length === 0 && <p className="py-2.5 text-sm text-oc-ink-muted">No applicants yet — share your campaigns to start getting applications.</p>}
          </div>
        </OcCard>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/brand/campaigns/new" className="rounded-full bg-oc-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-oc-700">
          Post Campaign
        </Link>
        <Link href="/creators" className="rounded-full border border-oc-border bg-oc-card px-5 py-2.5 text-sm font-semibold hover:bg-oc-bg">
          Browse Creators
        </Link>
        <Link href="/dashboard/brand/applicants" className="rounded-full border border-oc-border bg-oc-card px-5 py-2.5 text-sm font-semibold hover:bg-oc-bg">
          Review Applicants
        </Link>
      </div>
    </div>
  );
}
