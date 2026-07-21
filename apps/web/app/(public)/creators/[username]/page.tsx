import { and, desc, eq, ne, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { auth } from "@/auth";
import { SaveButton } from "@/components/oc/SaveButton";
import { ShareProfileButton } from "@/components/oc/ShareProfileButton";
import { CreatorCard } from "@/components/oc/CreatorCard";
import { Avatar, AvailabilityBadge, CategoryChip, VerificationBadge, formatCompactNumber, formatIDR, tileForSeed } from "@/components/oc/primitives";

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
      headline: schema.creatorProfiles.headline,
      languages: schema.creatorProfiles.languages,
      yearsOfExperience: schema.creatorProfiles.yearsOfExperience,
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
      featured: schema.creatorProfiles.featured,
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

  const title = `${creator.displayName} (@${creator.username})`;
  const description =
    creator.headline || creator.bio || `${creator.displayName} is a creator on OpenCollab.id, Indonesia's professional network for creator collaborations.`;

  const ogImage = `/api/og/creators/${creator.username}`;

  return {
    title,
    description,
    alternates: { canonical: `/creators/${creator.username}` },
    openGraph: {
      title,
      description,
      url: `/creators/${creator.username}`,
      type: "profile",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CreatorProfilePage({ params }: { params: { username: string } }) {
  const creator = await loadCreator(params.username);
  if (!creator || creator.status !== "active") notFound();

  const db = getDb();
  const session = await auth();

  const [socialAccounts, rateCards, portfolioItems, brandExperiences, contentCategories, similar, trackRecordRows] = await Promise.all([
    db
      .select({ id: schema.creatorSocialAccounts.id, platformName: schema.platforms.name, username: schema.creatorSocialAccounts.username, followerCount: schema.creatorSocialAccounts.followerCount, averageViews: schema.creatorSocialAccounts.averageViews, engagementRate: schema.creatorSocialAccounts.engagementRate, profileUrl: schema.creatorSocialAccounts.profileUrl })
      .from(schema.creatorSocialAccounts)
      .innerJoin(schema.platforms, eq(schema.platforms.id, schema.creatorSocialAccounts.platformId))
      .where(eq(schema.creatorSocialAccounts.creatorProfileId, creator.id)),
    db.select().from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, creator.id)),
    db.select().from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, creator.id)),
    db.select().from(schema.creatorBrandExperiences).where(eq(schema.creatorBrandExperiences.creatorProfileId, creator.id)),
    db
      .select({ name: schema.niches.name })
      .from(schema.creatorNiches)
      .innerJoin(schema.niches, eq(schema.niches.id, schema.creatorNiches.nicheId))
      .where(eq(schema.creatorNiches.creatorProfileId, creator.id)),
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
            featured: schema.creatorProfiles.featured,
            totalFollowers: sql<number>`(select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa where csa.creator_profile_id = creator_profiles.id)`,
            lastLoginAt: schema.users.lastLoginAt,
          })
          .from(schema.creatorProfiles)
          .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
          .leftJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
          .where(and(eq(schema.creatorProfiles.primaryNicheId, creator.primaryNicheId), ne(schema.creatorProfiles.id, creator.id), eq(schema.creatorProfiles.status, "active")))
          .limit(4)
      : Promise.resolve([]),
    // Real collaboration track record, not a fabricated stat — derived from this creator's
    // own campaign_applications rows. Response time is approximated as the average gap
    // between application submission and the brand's first status change away from
    // "submitted" (there's no dedicated "viewed_at" timestamp in the schema).
    db.execute(
      sql`select
            count(*)::int as total,
            count(*) filter (where status = 'accepted')::int as accepted,
            count(*) filter (where status = 'rejected')::int as rejected,
            avg(extract(epoch from (updated_at - created_at)) / 86400) filter (where status <> 'submitted') as avg_response_days
          from campaign_applications where creator_profile_id = ${creator.id}`
    ),
  ]);

  const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.followerCount ?? 0), 0);

  const trackRecord = (trackRecordRows as unknown as { total: number; accepted: number; rejected: number; avg_response_days: string | null }[])[0];
  const decidedApplications = (trackRecord?.accepted ?? 0) + (trackRecord?.rejected ?? 0);
  const acceptanceRate = decidedApplications > 0 ? Math.round(((trackRecord?.accepted ?? 0) / decidedApplications) * 100) : null;
  const avgResponseDays = trackRecord?.avg_response_days ? Math.round(Number(trackRecord.avg_response_days) * 10) / 10 : null;

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

  const headline =
    creator.headline ||
    [creator.primaryNicheName ? `${creator.primaryNicheName} Creator` : "Creator", creator.city, socialAccounts[0]?.platformName].filter(Boolean).join(" • ");

  const languages = Array.isArray(creator.languages) ? (creator.languages as string[]) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.displayName,
    alternateName: creator.username,
    description: headline,
    address: creator.city ? { "@type": "PostalAddress", addressLocality: creator.city, addressCountry: "ID" } : undefined,
    knowsLanguage: languages.length > 0 ? languages : undefined,
    image: creator.avatarUrl ?? undefined,
    sameAs: socialAccounts.map((a) => a.profileUrl).filter(Boolean),
  };

  return (
    <div>
      {/* JSON.stringify does not escape "</" sequences, so a creator-controlled bio/headline
          containing literal "</script>" could break out of this tag and inject arbitrary
          HTML — escaping "<" defuses that without affecting the JSON-LD's validity. */}
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <div className={`relative mb-8 overflow-hidden rounded-oc-xl p-8 sm:p-11 ${tileForSeed(creator.username)}`}>
        <div className="mb-4 flex justify-end sm:absolute sm:right-6 sm:top-6 sm:z-10 sm:mb-0">
          <ShareProfileButton username={creator.username} />
        </div>
        <div className="grid gap-10 sm:grid-cols-[1.1fr_1fr] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold text-oc-ink sm:text-4xl">{creator.displayName}</h1>
              <VerificationBadge status={creator.verificationStatus} />
            </div>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-oc-ink/75">{headline}</p>
            <p className="mt-1 text-sm text-oc-ink/60">
              @{creator.username}
              {creator.city ? ` · ${creator.city}` : ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {creator.featured && (
                <span className="rounded-full bg-oc-dark px-3.5 py-1.5 text-xs font-semibold text-white">★ Featured</span>
              )}
              {creator.primaryNicheName && (
                <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-oc-ink">{creator.primaryNicheName}</span>
              )}
              {creator.city && <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-oc-ink">{creator.city}</span>}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[220px] sm:ml-auto sm:mr-4">
            <div className="aspect-[11/14] w-full overflow-hidden rounded-oc-lg bg-white/40">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatarUrl} alt={creator.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-4xl font-extrabold text-oc-ink/30">
                  {creator.displayName.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="absolute -top-4 left-0 rounded-2xl bg-white px-4 py-2.5 shadow-oc">
              <p className="font-display text-lg font-extrabold text-oc-ink">{formatCompactNumber(totalFollowers)}</p>
              <p className="text-[11px] text-oc-ink-muted">Followers</p>
            </div>
            {acceptanceRate !== null && (
              <div className="absolute bottom-16 -left-8 rounded-2xl bg-tile-mustard px-4 py-2.5 shadow-oc">
                <p className="font-display text-lg font-extrabold text-oc-ink">{acceptanceRate}%</p>
                <p className="text-[11px] text-oc-ink/70">Acceptance</p>
              </div>
            )}
            {creator.yearsOfExperience !== null && (
              <div className="absolute -bottom-4 right-4 rounded-2xl bg-tile-sky px-4 py-2.5 shadow-oc">
                <p className="font-display text-lg font-extrabold text-oc-ink">{creator.yearsOfExperience} yrs</p>
                <p className="text-[11px] text-oc-ink/70">Experience</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {creator.bio && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Professional Summary</h2>
            <p className="mt-2 text-sm text-oc-ink-muted">{creator.bio}</p>
          </section>
        )}

        {(contentCategories.length > 0 || languages.length > 0 || creator.yearsOfExperience) && (
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {contentCategories.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Content Categories</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contentCategories.map((c) => (
                    <CategoryChip key={c.name}>{c.name}</CategoryChip>
                  ))}
                </div>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Languages</h2>
                <p className="mt-2 text-sm text-oc-ink">{languages.join(", ")}</p>
              </div>
            )}
            {creator.yearsOfExperience !== null && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">Experience</h2>
                <p className="mt-2 text-sm text-oc-ink">
                  {creator.yearsOfExperience} {creator.yearsOfExperience === 1 ? "year" : "years"} creating content
                </p>
              </div>
            )}
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-oc-ink">Creator Statistics</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
              <p className="text-lg font-semibold text-oc-ink">{formatCompactNumber(totalFollowers)}</p>
              <p className="text-xs text-oc-ink-muted">Total Followers</p>
            </div>
            {socialAccounts.map((acc) => (
              <div key={acc.id} className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
                <p className="text-lg font-semibold text-oc-ink">{formatCompactNumber(acc.followerCount)}</p>
                <p className="text-xs text-oc-ink-muted">{acc.platformName}</p>
              </div>
            ))}
          </div>
        </section>

        {trackRecord && trackRecord.total > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-oc-ink">Collaboration Track Record</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
                <p className="text-lg font-semibold text-oc-ink">{acceptanceRate !== null ? `${acceptanceRate}%` : "—"}</p>
                <p className="text-xs text-oc-ink-muted">Acceptance Rate</p>
              </div>
              <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
                <p className="text-lg font-semibold text-oc-ink">{trackRecord.accepted}</p>
                <p className="text-xs text-oc-ink-muted">Completed Collaborations</p>
              </div>
              <div className="rounded-oc border border-oc-border bg-oc-card p-3 text-center shadow-oc-sm">
                <p className="text-lg font-semibold text-oc-ink">{avgResponseDays !== null ? `~${avgResponseDays}d` : "—"}</p>
                <p className="text-xs text-oc-ink-muted">Avg. Response Time</p>
              </div>
            </div>
          </section>
        )}

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
            <h2 className="text-sm font-semibold text-oc-ink">Brand Experience</h2>
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
              {similar.map((c, i) => (
                <CreatorCard key={c.username} creator={c} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-oc-lg border border-oc-border bg-oc-card p-6 shadow-oc-sm">
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
    </div>
  );
}
