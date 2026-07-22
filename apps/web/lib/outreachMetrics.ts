import { and, eq, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// Ops staff are Jakarta-based (WIB, UTC+7, no DST) — computing "today"/"this week"/"this month"
// boundaries in whatever timezone the Node process happens to run in (typically UTC on Vercel)
// would misclassify activity logged before ~07:00 WIB as "yesterday". These convert the current
// instant to Jakarta wall-clock time to find the right calendar boundary, then convert that
// boundary back to a correct UTC instant for comparison against timestamptz columns.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfTodayWIB(): string {
  const nowWib = new Date(Date.now() + JAKARTA_OFFSET_MS);
  const y = nowWib.getUTCFullYear();
  const m = nowWib.getUTCMonth();
  const d = nowWib.getUTCDate();
  return new Date(Date.UTC(y, m, d) - JAKARTA_OFFSET_MS).toISOString();
}

function startOfWeekWIB(): string {
  const nowWib = new Date(Date.now() + JAKARTA_OFFSET_MS);
  const y = nowWib.getUTCFullYear();
  const m = nowWib.getUTCMonth();
  const d = nowWib.getUTCDate();
  const day = nowWib.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  return new Date(Date.UTC(y, m, d - diff) - JAKARTA_OFFSET_MS).toISOString();
}

function startOfMonthWIB(): string {
  const nowWib = new Date(Date.now() + JAKARTA_OFFSET_MS);
  const y = nowWib.getUTCFullYear();
  const m = nowWib.getUTCMonth();
  return new Date(Date.UTC(y, m, 1) - JAKARTA_OFFSET_MS).toISOString();
}

export async function kolKpis() {
  const db = getDb();
  const today = startOfTodayWIB();
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

export async function brandKpis() {
  const db = getDb();
  const today = startOfTodayWIB();
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
  responseSecondsSum: number;
  respondedCount: number;
}

/** Per-PIC leaderboard/response-time rollup, computed as a GROUP BY aggregate in Postgres (one
 * row per PIC) rather than pulling every outreach row back and aggregating in Node — the former
 * scales with outreach volume even as the system grows to thousands of records. */
async function picRollups(): Promise<PicRollup[]> {
  const db = getDb();

  const [kolRows, brandRows] = await Promise.all([
    db
      .select({
        picUserId: schema.kolOutreach.picUserId,
        picName: schema.users.fullName,
        reached: sql<number>`count(*)`,
        accepted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} in ('accepted', 'converted'))`,
        converted: sql<number>`count(*) filter (where ${schema.kolOutreach.status} = 'converted')`,
        responseSecondsSum: sql<number>`coalesce(sum(extract(epoch from (${schema.kolOutreach.statusChangedAt} - ${schema.kolOutreach.createdAt}))) filter (where ${schema.kolOutreach.status} != 'new' and ${schema.kolOutreach.statusChangedAt} is not null), 0)`,
        respondedCount: sql<number>`count(*) filter (where ${schema.kolOutreach.status} != 'new' and ${schema.kolOutreach.statusChangedAt} is not null)`,
      })
      .from(schema.kolOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.kolOutreach.picUserId))
      .groupBy(schema.kolOutreach.picUserId, schema.users.fullName),
    db
      .select({
        picUserId: schema.brandOutreach.picUserId,
        picName: schema.users.fullName,
        reached: sql<number>`count(*)`,
        accepted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} in ('accepted', 'converted'))`,
        converted: sql<number>`count(*) filter (where ${schema.brandOutreach.status} = 'converted')`,
        responseSecondsSum: sql<number>`coalesce(sum(extract(epoch from (${schema.brandOutreach.statusChangedAt} - ${schema.brandOutreach.createdAt}))) filter (where ${schema.brandOutreach.status} != 'new' and ${schema.brandOutreach.statusChangedAt} is not null), 0)`,
        respondedCount: sql<number>`count(*) filter (where ${schema.brandOutreach.status} != 'new' and ${schema.brandOutreach.statusChangedAt} is not null)`,
      })
      .from(schema.brandOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandOutreach.picUserId))
      .groupBy(schema.brandOutreach.picUserId, schema.users.fullName),
  ]);

  const rollups = new Map<string, PicRollup>();
  for (const row of [...kolRows, ...brandRows]) {
    const entry = rollups.get(row.picUserId) ?? {
      picUserId: row.picUserId,
      picName: row.picName ?? "Unknown",
      reached: 0,
      accepted: 0,
      converted: 0,
      responseSecondsSum: 0,
      respondedCount: 0,
    };
    entry.reached += Number(row.reached);
    entry.accepted += Number(row.accepted);
    entry.converted += Number(row.converted);
    entry.responseSecondsSum += Number(row.responseSecondsSum);
    entry.respondedCount += Number(row.respondedCount);
    rollups.set(row.picUserId, entry);
  }
  return Array.from(rollups.values());
}

export async function dailyDashboard(currentUserId: string) {
  const db = getDb();
  const today = startOfTodayWIB();
  const week = startOfWeekWIB();
  const month = startOfMonthWIB();

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
    .map((r) => ({ picUserId: r.picUserId, picName: r.picName, reached: r.reached, accepted: r.accepted, converted: r.converted }))
    .sort((a, b) => b.converted - a.converted || b.accepted - a.accepted || b.reached - a.reached);

  const mine = rollups.find((r) => r.picUserId === currentUserId);
  const avgResponseHours = mine && mine.respondedCount > 0 ? mine.responseSecondsSum / mine.respondedCount / 3600 : null;

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
