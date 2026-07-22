export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

// postgres-js can't bind a raw Date object interpolated into a drizzle sql`` template (it only
// accepts string/Buffer/ArrayBuffer at the wire level) — these return ISO strings instead, which
// Postgres compares against timestamptz columns just fine.

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(): string {
  const d = new Date(startOfToday());
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString();
}

function startOfMonth(): string {
  const d = new Date(startOfToday());
  d.setDate(1);
  return d.toISOString();
}

async function kolKpis() {
  const db = getDb();
  const today = startOfToday();
  const [row] = await db
    .select({
      totalContacted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} != 'new')`,
      todaysOutreach: sql<number>`count(*) filter (where ${schema.kolOutreach.createdAt} >= ${today})`,
      waitingReply: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'contacted')`,
      needFollowUp: sql<number>`count(*) filter (where ${schema.kolOutreach.status} in ('no_reply', 'follow_up_1', 'follow_up_2'))`,
      accepted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'accepted')`,
      rejected: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'rejected')`,
      converted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'converted')`,
    })
    .from(schema.kolOutreach);
  return {
    totalContacted: Number(row.totalContacted),
    todaysOutreach: Number(row.todaysOutreach),
    waitingReply: Number(row.waitingReply),
    needFollowUp: Number(row.needFollowUp),
    accepted: Number(row.accepted),
    rejected: Number(row.rejected),
    converted: Number(row.converted),
  };
}

async function brandKpis() {
  const db = getDb();
  const today = startOfToday();
  const [row] = await db
    .select({
      totalContacted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} != 'new')`,
      todaysOutreach: sql<number>`count(*) filter (where ${schema.brandOutreach.createdAt} >= ${today})`,
      interested: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'interested')`,
      campaignRequested: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'campaign_requested')`,
      accepted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'accepted')`,
      rejected: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'rejected')`,
      converted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'converted')`,
    })
    .from(schema.brandOutreach);
  return {
    totalContacted: Number(row.totalContacted),
    todaysOutreach: Number(row.todaysOutreach),
    interested: Number(row.interested),
    campaignRequested: Number(row.campaignRequested),
    accepted: Number(row.accepted),
    rejected: Number(row.rejected),
    converted: Number(row.converted),
  };
}

interface PicRollup {
  picUserId: string;
  picName: string;
  reached: number;
  accepted: number;
  converted: number;
  responseSeconds: number[];
}

async function picRollups() {
  const db = getDb();
  const rollups = new Map<string, PicRollup>();

  function add(picUserId: string, picName: string, status: string, createdAt: Date, statusChangedAt: Date | null) {
    let entry = rollups.get(picUserId);
    if (!entry) {
      entry = { picUserId, picName, reached: 0, accepted: 0, converted: 0, responseSeconds: [] };
      rollups.set(picUserId, entry);
    }
    entry.reached += 1;
    if (status === "accepted" || status === "converted") entry.accepted += 1;
    if (status === "converted") entry.converted += 1;
    if (statusChangedAt && status !== "new") {
      entry.responseSeconds.push((statusChangedAt.getTime() - createdAt.getTime()) / 1000);
    }
  }

  const [kolRows, brandRows] = await Promise.all([
    db
      .select({
        picUserId: schema.kolOutreach.picUserId,
        picName: schema.users.fullName,
        status: schema.kolOutreach.status,
        createdAt: schema.kolOutreach.createdAt,
        statusChangedAt: schema.kolOutreach.statusChangedAt,
      })
      .from(schema.kolOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.kolOutreach.picUserId)),
    db
      .select({
        picUserId: schema.brandOutreach.picUserId,
        picName: schema.users.fullName,
        status: schema.brandOutreach.status,
        createdAt: schema.brandOutreach.createdAt,
        statusChangedAt: schema.brandOutreach.statusChangedAt,
      })
      .from(schema.brandOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandOutreach.picUserId)),
  ]);
  for (const r of kolRows) add(r.picUserId, r.picName ?? "Unknown", r.status, r.createdAt, r.statusChangedAt);

  for (const r of brandRows) add(r.picUserId, r.picName ?? "Unknown", r.status, r.createdAt, r.statusChangedAt);

  return Array.from(rollups.values());
}

async function dailyDashboard(currentUserId: string) {
  const db = getDb();
  const today = startOfToday();
  const week = startOfWeek();
  const month = startOfMonth();

  const [rollups, [myKolCounts], [myBrandCounts], [followUpsDueToday], [brandsWaitingReply], [kolsAcceptedNotOnboarded]] = await Promise.all([
    picRollups(),
    db
      .select({
        today: sql<number>`count(*) filter (where ${schema.kolOutreach.createdAt} >= ${today})`,
        thisWeek: sql<number>`count(*) filter (where ${schema.kolOutreach.createdAt} >= ${week})`,
        thisMonth: sql<number>`count(*) filter (where ${schema.kolOutreach.createdAt} >= ${month})`,
        profilesCompleted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'profile_completed')`,
        converted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'converted')`,
        needFollowUp: sql<number>`count(*) filter (where ${schema.kolOutreach.status} in ('no_reply', 'follow_up_1', 'follow_up_2'))`,
        interested: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'interested')`,
      })
      .from(schema.kolOutreach)
      .where(eq(schema.kolOutreach.picUserId, currentUserId)),
    db
      .select({
        today: sql<number>`count(*) filter (where ${schema.brandOutreach.createdAt} >= ${today})`,
        thisWeek: sql<number>`count(*) filter (where ${schema.brandOutreach.createdAt} >= ${week})`,
        thisMonth: sql<number>`count(*) filter (where ${schema.brandOutreach.createdAt} >= ${month})`,
        converted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'converted')`,
        needFollowUp: sql<number>`count(*) filter (where ${schema.brandOutreach.status} in ('no_reply', 'follow_up_1', 'follow_up_2'))`,
      })
      .from(schema.brandOutreach)
      .where(eq(schema.brandOutreach.picUserId, currentUserId)),
    // Notifications panel: follow-ups due today, brands waiting reply, KOLs accepted (not yet
    // onboarded) — computed on load, no push/email infrastructure.
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.kolOutreach)
      .where(and(eq(schema.kolOutreach.picUserId, currentUserId), notInArray(schema.kolOutreach.status, ["converted", "rejected"]))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.brandOutreach)
      .where(and(eq(schema.brandOutreach.picUserId, currentUserId), eq(schema.brandOutreach.status, "contacted"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.kolOutreach)
      .where(and(eq(schema.kolOutreach.picUserId, currentUserId), eq(schema.kolOutreach.status, "accepted"))),
  ]);

  const leaderboard = rollups
    .map((r) => ({
      picUserId: r.picUserId,
      picName: r.picName,
      reached: r.reached,
      accepted: r.accepted,
      converted: r.converted,
    }))
    .sort((a, b) => b.converted - a.converted || b.accepted - a.accepted || b.reached - a.reached);

  const mine = rollups.find((r) => r.picUserId === currentUserId);
  const avgResponseHours = mine && mine.responseSeconds.length > 0
    ? mine.responseSeconds.reduce((a, b) => a + b, 0) / mine.responseSeconds.length / 3600
    : null;

  return {
    leaderboard,
    mine: {
      kol: {
        today: Number(myKolCounts.today),
        thisWeek: Number(myKolCounts.thisWeek),
        thisMonth: Number(myKolCounts.thisMonth),
        profilesCompleted: Number(myKolCounts.profilesCompleted),
        converted: Number(myKolCounts.converted),
        needFollowUp: Number(myKolCounts.needFollowUp),
        interested: Number(myKolCounts.interested),
      },
      brand: {
        today: Number(myBrandCounts.today),
        thisWeek: Number(myBrandCounts.thisWeek),
        thisMonth: Number(myBrandCounts.thisMonth),
        converted: Number(myBrandCounts.converted),
        needFollowUp: Number(myBrandCounts.needFollowUp),
      },
      acceptanceRate: mine && mine.reached > 0 ? Math.round((mine.accepted / mine.reached) * 100) : 0,
      conversionRate: mine && mine.reached > 0 ? Math.round((mine.converted / mine.reached) * 100) : 0,
      avgResponseHours: avgResponseHours !== null ? Math.round(avgResponseHours * 10) / 10 : null,
    },
    notifications: {
      followUpsDueToday: Number(followUpsDueToday.count),
      brandsWaitingReply: Number(brandsWaitingReply.count),
      kolsAcceptedNotOnboarded: Number(kolsAcceptedNotOnboarded.count),
    },
  };
}

export async function GET(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope");

  if (scope === "brand") return NextResponse.json(await brandKpis());
  if (scope === "daily") return NextResponse.json(await dailyDashboard(session.user.id));
  return NextResponse.json(await kolKpis());
}
