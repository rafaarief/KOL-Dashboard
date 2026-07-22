"use client";

import { useEffect, useState } from "react";
import { OcCard, OcLinkButton } from "@/components/oc/primitives";

interface DailyDashboard {
  leaderboard: { picUserId: string; picName: string; reached: number; accepted: number; converted: number }[];
  mine: {
    kol: { today: number; thisWeek: number; thisMonth: number; profilesCompleted: number; converted: number; needFollowUp: number; interested: number };
    brand: { today: number; thisWeek: number; thisMonth: number; converted: number; needFollowUp: number };
    acceptanceRate: number;
    conversionRate: number;
    avgResponseHours: number | null;
  };
  notifications: { followUpsDueToday: number; brandsWaitingReply: number; kolsAcceptedNotOnboarded: number };
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <OcCard className="px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-oc-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-oc-ink">{value}</p>
    </OcCard>
  );
}

export default function OutreachDashboardPage() {
  const [data, setData] = useState<DailyDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/outreach/metrics?scope=daily")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setData)
      .catch(() => setError("Couldn't load the dashboard."));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Outreach Dashboard</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">Today's activity, your progress, and the team leaderboard.</p>

      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {data && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <OcLinkButton href="/admin/outreach/kols/new">Add KOL</OcLinkButton>
            <OcLinkButton href="/admin/outreach/brands/new" variant="secondary">
              Add Brand
            </OcLinkButton>
          </div>

          {(data.notifications.followUpsDueToday > 0 || data.notifications.brandsWaitingReply > 0 || data.notifications.kolsAcceptedNotOnboarded > 0) && (
            <OcCard className="mt-6 border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-900">Needs your attention</p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-900">
                {data.notifications.followUpsDueToday > 0 && (
                  <li>
                    <a href="/admin/outreach/kols?mine=true" className="hover:underline">
                      {data.notifications.followUpsDueToday} KOL{data.notifications.followUpsDueToday === 1 ? "" : "s"} still in progress — follow up.
                    </a>
                  </li>
                )}
                {data.notifications.brandsWaitingReply > 0 && (
                  <li>
                    <a href="/admin/outreach/brands?mine=true" className="hover:underline">
                      {data.notifications.brandsWaitingReply} brand{data.notifications.brandsWaitingReply === 1 ? "" : "s"} waiting on a reply.
                    </a>
                  </li>
                )}
                {data.notifications.kolsAcceptedNotOnboarded > 0 && (
                  <li>
                    <a href="/admin/outreach/kols?mine=true&status=accepted" className="hover:underline">
                      {data.notifications.kolsAcceptedNotOnboarded} KOL{data.notifications.kolsAcceptedNotOnboarded === 1 ? "" : "s"} accepted — ready for onboarding.
                    </a>
                  </li>
                )}
              </ul>
            </OcCard>
          )}

          <p className="mt-6 text-sm font-semibold text-oc-ink">Your progress today</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="KOLs Reached Today" value={data.mine.kol.today} />
            <StatTile label="Brands Reached Today" value={data.mine.brand.today} />
            <StatTile label="Need Follow Up" value={data.mine.kol.needFollowUp + data.mine.brand.needFollowUp} />
            <StatTile label="Interested" value={data.mine.kol.interested} />
          </div>

          <p className="mt-6 text-sm font-semibold text-oc-ink">Your all-time performance</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="This Week (KOL)" value={data.mine.kol.thisWeek} />
            <StatTile label="This Month (KOL)" value={data.mine.kol.thisMonth} />
            <StatTile label="Acceptance Rate" value={`${data.mine.acceptanceRate}%`} />
            <StatTile label="Conversion Rate" value={`${data.mine.conversionRate}%`} />
            <StatTile label="Profiles Completed" value={data.mine.kol.profilesCompleted} />
            <StatTile label="KOLs Converted" value={data.mine.kol.converted} />
            <StatTile label="Brands Converted" value={data.mine.brand.converted} />
            <StatTile label="Avg. Response Time" value={data.mine.avgResponseHours !== null ? `${data.mine.avgResponseHours}h` : "—"} />
          </div>

          <p className="mt-6 text-sm font-semibold text-oc-ink">Leaderboard</p>
          <OcCard className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
                  <th className="px-4 py-3">PIC</th>
                  <th className="px-4 py-3">Reached</th>
                  <th className="px-4 py-3">Accepted</th>
                  <th className="px-4 py-3">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oc-border">
                {data.leaderboard.map((row) => (
                  <tr key={row.picUserId}>
                    <td className="px-4 py-3 font-medium text-oc-ink">{row.picName}</td>
                    <td className="px-4 py-3 text-oc-ink-muted">{row.reached.toLocaleString()}</td>
                    <td className="px-4 py-3 text-oc-ink-muted">{row.accepted.toLocaleString()}</td>
                    <td className="px-4 py-3 text-oc-ink-muted">{row.converted.toLocaleString()}</td>
                  </tr>
                ))}
                {data.leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-oc-ink-muted">
                      No outreach activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </OcCard>
        </>
      )}
    </div>
  );
}
