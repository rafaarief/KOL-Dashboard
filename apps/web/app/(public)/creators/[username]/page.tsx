import { and, desc, eq, ne, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { auth } from "@/auth";
import { SaveButton } from "@/components/oc/SaveButton";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { Avatar, AvailabilityBadge, VerificationBadge, formatCompactNumber, formatIDR } from "@/components/oc/primitives";

export const dynamic = "force-dynamic";

async function loadCreator(username: string) {
  const db = getDb();
  const [creator] = await db
    .select({
      id: schema.creatorProfiles.id,
      userId: schema.creatorProfiles.userId,
      username: schema.creatorProfiles.username,
      displayName: schema.creatorProfiles.displayName,
      city: schema.creatorProfiles.city,
      bio: schema.creatorProfiles.bio,
      avatarUrl: schema.creatorProfiles.avatarUrl,
      coverImageUrl: schema.creatorProfiles.coverImageUrl,
      availabilityStatus: schema.creatorProfiles.availabilityStatus,
      availableFrom: schema.creatorProfiles.availableFrom,
      availableUntil: schema.creatorProfiles.availableUntil,
      monthlyCapacity: schema.creatorProfiles.monthlyCapacity,
      slotsRemaining: schema.creatorProfiles.slotsRemaining,
      minimumBudget: schema.creatorProfiles.minimumBudget,
      acceptsBarter: schema.creatorProfiles.acceptsBarter,
      acceptsAffiliate: schema.creatorProfiles.acceptsAffiliate,
      acceptsPaid: schema.creatorProfiles.acceptsPaid,
      acceptsEventAttendance: schema.creatorProfiles.acceptsEventAttendance,
      acceptsAmbassador: schema.creatorProfiles.acceptsAmbassador,
      contactEmail: schema.creatorProfiles.contactEmail,
      contactWhatsapp: schema.creatorProfiles.contactWhatsapp,
      contactVisible: schema.creatorProfiles.contactVisible,
      verificationStatus: schema.creatorProfiles.verificationStatus,
      status: schema.creatorProfiles.status,
      primaryNicheId: schema.creatorProfiles.primaryNicheId,
      primaryNicheName: schema.niches.name,
    })
    .from(schema.creatorProfiles)
    .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
    .where(eq(schema.creatorProfiles.username, username))
    .limit(1);

  return creator ?? null;
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const creator = await loadCreator(params.username);
  if (!creator) return { title: "Creator not found" };
  return {
    title: `${creator.displayName} (@${creator.username})`,
    description: creator.bio ?? `${creator.displayName}'s creator profile on OpenCollab.id`,
  };
}

export default async function CreatorProfilePage({ params }: { params: { username: string } }) {
  const creator = await loadCreator(params.username);
  if (!creator || creator.status !== "active") notFound();

  const db = getDb();
  const session = await auth();

  const [socialAccounts, rateCards, portfolioItems, brandExperiences, similar] = await Promise.all([
    db
      .select({ id: schema.creatorSocialAccounts.id, platformName: schema.platforms.name, username: schema.creatorSocialAccounts.username, followerCount: schema.creatorSocialAccounts.followerCount, averageViews: schema.creatorSocialAccounts.averageViews, engagementRate: schema.creatorSocialAccounts.engagementRate, profileUrl: schema.creatorSocialAccounts.profileUrl })
      .from(schema.creatorSocialAccounts)
      .innerJoin(schema.platforms, eq(schema.platforms.id, schema.creatorSocialAccounts.platformId))
      .where(eq(schema.creatorSocialAccounts.creatorProfileId, creator.id)),
    db.select().from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, creator.id)),
    db.select().from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, creator.id)),
    db.select().from(schema.creatorBrandExperiences).where(eq(schema.creatorBrandExperiences.creatorProfileId, creator.id)),
    creator.primaryNicheId
      ? db
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
          })
          .from(schema.creatorProfiles)
          .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
          .where(and(eq(schema.creatorProfiles.primaryNicheId, creator.primaryNicheId), ne(schema.creatorProfiles.id, creator.id), eq(schema.creatorProfiles.status, "active")))
          .limit(4)
      : Promise.resolve([]),
  ]);

  const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.followerCount ?? 0), 0);

  let alreadySaved = false;
  if (session?.user.role === "brand") {
    const [saved] = await db
      .select()
      .from(schema.savedCreators)
      .where(and(eq(schema.savedCreators.userId, session.user.id), eq(schema.savedCreators.creatorProfileId, creator.id)))
      .limit(1);
    alreadySaved = Boolean(saved);
  }

  const preferences = [
    creator.acceptsPaid && "Paid",
    creator.acceptsBarter && "Barter",
    creator.acceptsAffiliate && "Affiliate",
    creator.acceptsEventAttendance && "Event Attendance",
    creator.acceptsAmbassador && "Brand Ambassador",
  ].filter(Boolean) as string[];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-center gap-4">
          <Avatar name={creator.displayName} url={creator.avatarUrl} size={72} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-oc-ink">{creator.displayName}</h1>
              <VerificationBadge status={creator.verificationStatus} />
            </div>
            <p className="text-sm text-oc-ink-muted">
              @{creator.username}
              {creator.city ? ` · ${creator.city}` : ""}
            </p>
          </div>
        </div>

        {creator.bio && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">About</h2>
            <p className="mt-2 text-sm text-oc-ink-muted">{creator.bio}</p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">Creator Statistics</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center">
              <p className="text-lg font-semibold text-oc-ink">{formatCompactNumber(totalFollowers)}</p>
              <p className="text-xs text-oc-ink-muted">Total Followers</p>
            </div>
            {socialAccounts.map((acc) => (
              <div key={acc.id} className="rounded-oc border border-oc-border bg-oc-card p-3 text-center">
                <p className="text-lg font-semibold text-oc-ink">{formatCompactNumber(acc.followerCount)}</p>
                <p className="text-xs text-oc-ink-muted">{acc.platformName}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">Platforms</h2>
          <div className="mt-2 space-y-2">
            {socialAccounts.map((acc) => (
              <a
                key={acc.id}
                href={acc.profileUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-oc border border-oc-border bg-oc-card px-4 py-2 text-sm hover:bg-oc-bg"
              >
                <span className="font-medium text-oc-ink">{acc.platformName} · @{acc.username}</span>
                <span className="text-xs text-oc-ink-muted">
                  {formatCompactNumber(acc.followerCount)} followers
                  {acc.engagementRate ? ` · ${acc.engagementRate}% ER` : ""}
                </span>
              </a>
            ))}
            {socialAccounts.length === 0 && <p className="text-sm text-oc-ink-muted">No linked platforms yet.</p>}
          </div>
        </section>

        {rateCards.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Rate Card</h2>
            <div className="mt-2 divide-y divide-oc-border rounded-oc border border-oc-border bg-oc-card">
              {rateCards.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-oc-ink">{rate.deliverableType}</span>
                  <span className="font-medium text-oc-ink">
                    {rate.visibility === "contact" ? "Contact for rate" : rate.visibility === "negotiable" ? "Negotiable" : `Starting from ${formatIDR(rate.price)}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {portfolioItems.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Portfolio</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {portfolioItems.map((item) => (
                <a
                  key={item.id}
                  href={item.linkUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-oc border border-oc-border bg-oc-card p-4 text-sm hover:bg-oc-bg"
                >
                  <p className="font-medium text-oc-ink">{item.title}</p>
                  {item.description && <p className="mt-1 text-xs text-oc-ink-muted">{item.description}</p>}
                </a>
              ))}
            </div>
          </section>
        )}

        {brandExperiences.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Past Brand Collaborations</h2>
            <ul className="mt-2 space-y-1 text-sm text-oc-ink-muted">
              {brandExperiences.map((exp) => (
                <li key={exp.id}>
                  {exp.brandName}
                  {exp.year ? ` (${exp.year})` : ""} {exp.description ? `— ${exp.description}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-oc-ink">Similar Creators</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {similar.map((c) => (
                <CreatorCard key={c.username} creator={c} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6 shadow-sm">
          <AvailabilityBadge status={creator.availabilityStatus} />
          {creator.slotsRemaining !== null && creator.monthlyCapacity && (
            <p className="mt-2 text-xs text-oc-ink-muted">
              {creator.slotsRemaining} of {creator.monthlyCapacity} monthly slots remaining
            </p>
          )}
          <p className="mt-3 text-sm font-semibold text-oc-ink">
            {creator.minimumBudget ? `From ${formatIDR(creator.minimumBudget)}` : "Contact for rate"}
          </p>

          {preferences.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preferences.map((p) => (
                <span key={p} className="rounded-full border border-oc-border px-2.5 py-0.5 text-xs text-oc-ink-muted">
                  {p}
                </span>
              ))}
            </div>
          )}

          {creator.contactVisible && creator.contactEmail && (
            <p className="mt-3 text-xs text-oc-ink-muted">Contact: {creator.contactEmail}</p>
          )}

          {session?.user.role === "brand" && (
            <div className="mt-4 flex flex-col gap-2">
              <SaveButton endpoint="/api/brand/saved-creators" targetId={creator.id} initialSaved={alreadySaved} label="Save Creator" />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
