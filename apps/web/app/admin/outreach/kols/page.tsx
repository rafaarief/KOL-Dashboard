"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { OcCard, OcLinkButton, OutreachStatusBadge, Pagination } from "@/components/oc/primitives";
import { KOL_OUTREACH_STATUSES, OUTREACH_SOURCE_LABELS, OUTREACH_SOURCES, OUTREACH_STATUS_LABELS } from "@/lib/outreachEnums";

interface KolOutreachRow {
  id: string;
  picName: string;
  kolName: string;
  email: string | null;
  phone: string | null;
  instagramUrl: string | null;
  instagramFollowers: number | null;
  tiktokUrl: string | null;
  tiktokFollowers: number | null;
  city: string | null;
  source: string;
  status: string;
  lastFollowUpAt: string | null;
  createdAt: string;
}

interface KolKpis {
  totalContacted: number;
  todaysOutreach: number;
  waitingReply: number;
  needFollowUp: number;
  accepted: number;
  rejected: number;
  converted: number;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <OcCard className="px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-oc-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-oc-ink">{value.toLocaleString()}</p>
    </OcCard>
  );
}

export default function KolOutreachPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [mine, setMine] = useState(false);
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error } = useFilteredList<KolOutreachRow>("/api/admin/outreach/kols", {
    q: debouncedQ,
    status,
    source,
    mine,
  });
  const [kpis, setKpis] = useState<KolKpis | null>(null);

  useEffect(() => {
    fetch("/api/admin/outreach/metrics?scope=kol")
      .then((res) => (res.ok ? res.json() : null))
      .then(setKpis)
      .catch(() => setKpis(null));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-oc-ink">KOL Outreach</h1>
          <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} KOLs tracked.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/outreach/kols?format=csv" className="rounded-oc-input border border-oc-border px-3.5 py-1.5 text-sm hover:bg-oc-bg">
            Export CSV
          </a>
          <OcLinkButton href="/admin/outreach/kols/new">Add KOL</OcLinkButton>
        </div>
      </div>

      {kpis && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatTile label="Total Contacted" value={kpis.totalContacted} />
          <StatTile label="Today's Outreach" value={kpis.todaysOutreach} />
          <StatTile label="Waiting Reply" value={kpis.waitingReply} />
          <StatTile label="Need Follow Up" value={kpis.needFollowUp} />
          <StatTile label="Accepted" value={kpis.accepted} />
          <StatTile label="Rejected" value={kpis.rejected} />
          <StatTile label="Converted" value={kpis.converted} />
        </div>
      )}

      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, Instagram, TikTok, or city"
          className="w-72 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {KOL_OUTREACH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {OUTREACH_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All sources</option>
          {OUTREACH_SOURCES.map((s) => (
            <option key={s} value={s}>
              {OUTREACH_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-oc-ink-muted">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          My records only
        </label>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">KOL</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">TikTok</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Follow Up</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/outreach/kols/${row.id}`} className="font-medium text-oc-ink hover:underline">
                    {row.kolName}
                  </Link>
                  <p className="text-xs text-oc-ink-muted">{row.email ?? row.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.picName}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.instagramFollowers?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.tiktokFollowers?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3">{row.city ?? "—"}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{OUTREACH_SOURCE_LABELS[row.source] ?? row.source}</td>
                <td className="px-4 py-3">
                  <OutreachStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.lastFollowUpAt ? new Date(row.lastFollowUpAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-oc-ink-muted">
                  No KOL outreach records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>

      <Pagination page={page} totalPages={totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
    </div>
  );
}
