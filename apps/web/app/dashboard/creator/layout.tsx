import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { DashboardSidebar } from "@/components/oc/DashboardSidebar";
import { ShareProfileButton } from "@/components/oc/ShareProfileButton";

export const metadata: Metadata = { title: "Creator Workspace", robots: { index: false, follow: false } };

const TABS = [
  { href: "/dashboard/creator", label: "Overview", exact: true },
  { href: "/dashboard/creator/profile", label: "Professional Profile" },
  { href: "/dashboard/creator/availability", label: "Availability" },
  { href: "/dashboard/creator/rates", label: "Rate Card" },
  { href: "/dashboard/creator/portfolio", label: "Portfolio" },
  { href: "/dashboard/creator/applications", label: "Collaboration Applications" },
  { href: "/dashboard/creator/saved-campaigns", label: "Saved" },
  { href: "/dashboard/creator/settings", label: "Settings" },
];

async function getCompletion(userId: string) {
  const db = getDb();
  const [profile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, userId)).limit(1);
  if (!profile) return null;

  const [rateCardCount, portfolioCount, socialAccountCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, profile.id)),
    db.select({ count: sql<number>`count(*)` }).from(schema.creatorSocialAccounts).where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id)),
  ]);

  const checks = [
    Boolean(profile.bio),
    Boolean(profile.city),
    Boolean(profile.primaryNicheId),
    Number(socialAccountCount[0].count) > 0,
    Number(rateCardCount[0].count) > 0,
    Number(portfolioCount[0].count) > 0,
  ];

  return { percent: Math.round((checks.filter(Boolean).length / checks.length) * 100), username: profile.username };
}

export default async function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const completion = await getCompletion(session.user.id);

  return (
    <div className="min-h-screen bg-oc-bg pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <DashboardSidebar items={TABS} accent="coral" />
        <div>
          {completion && (
            <div className="flex justify-end">
              <ShareProfileButton username={completion.username} variant="link" />
            </div>
          )}

          {completion && completion.percent < 100 && (
            <Link
              href="/dashboard/creator/profile"
              className="mt-2 flex items-center justify-between gap-3 rounded-oc-lg bg-tile-lavender px-5 py-4 text-sm hover:brightness-95"
            >
              <span className="text-oc-ink">
                Your professional profile is <strong>{completion.percent}% complete</strong> — finish it so brands take you seriously.
              </span>
              <span className="shrink-0 font-semibold text-oc-ink">Complete now →</span>
            </Link>
          )}

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
