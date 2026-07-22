"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OcButton, OcCard, OcLinkButton, OutreachStatusBadge } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";
import { BRAND_OUTREACH_STATUSES, OUTREACH_STATUS_LABELS } from "@/lib/outreachEnums";

interface OutreachDetail {
  id: string;
  picName: string;
  brandName: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  instagramUrl: string | null;
  instagramFollowers: number | null;
  tiktokUrl: string | null;
  tiktokFollowers: number | null;
  website: string | null;
  source: string;
  status: string;
  notes: string | null;
  lastFollowUpAt: string | null;
  convertedBrandProfileId: string | null;
  createdAt: string;
}

interface OutreachEvent {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdByName: string | null;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  created: "Created",
  status_changed: "Status changed",
  follow_up: "Follow up logged",
  note: "Note added",
};

export default function BrandOutreachDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [outreach, setOutreach] = useState<OutreachDetail | null>(null);
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/admin/outreach/brands/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: { outreach: OutreachDetail; events: OutreachEvent[] }) => {
        setOutreach(body.outreach);
        setEvents(body.events);
        setNoteDraft(body.outreach.notes ?? "");
      })
      .catch(() => showToast("Couldn't load this brand.", "error"));
  }

  useEffect(load, [params.id]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    const response = await fetch(`/api/admin/outreach/brands/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    showToast(response.ok ? successMessage : "That action failed.", response.ok ? "success" : "error");
    load();
  }

  if (!outreach) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-oc-ink">{outreach.brandName}</h1>
            <OutreachStatusBadge status={outreach.status} />
          </div>
          <p className="mt-1 text-sm text-oc-ink-muted">
            PIC: {outreach.picName} · {outreach.email ?? outreach.phone ?? "No contact on file"}
          </p>
        </div>
        {outreach.status === "converted" ? (
          outreach.convertedBrandProfileId && (
            <OcLinkButton href={`/admin/brands/${outreach.convertedBrandProfileId}`} variant="secondary">
              View converted profile
            </OcLinkButton>
          )
        ) : (
          <OcLinkButton href={`/admin/outreach/onboard-brand?outreachId=${outreach.id}`}>Convert to Onboarding</OcLinkButton>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BRAND_OUTREACH_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={saving || s === outreach.status}
                  onClick={() => patch({ status: s }, "Status updated.")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    s === outreach.status ? "border-oc-dark bg-oc-dark text-white" : "border-oc-border hover:bg-oc-bg"
                  }`}
                >
                  {OUTREACH_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <OcButton
              variant="secondary"
              className="mt-3"
              disabled={saving}
              onClick={() => patch({ logFollowUp: true }, "Follow up logged.")}
            >
              Log follow up today
            </OcButton>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Notes</p>
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Internal notes only."
              className="mt-2 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
            <OcButton className="mt-2" disabled={saving} onClick={() => patch({ notes: noteDraft }, "Note saved.")}>
              Save note
            </OcButton>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Timeline</p>
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border-l-2 border-oc-border pl-3 text-sm">
                  <p className="text-oc-ink">
                    {EVENT_LABELS[event.eventType] ?? event.eventType}
                    {event.fromStatus && event.toStatus && (
                      <span className="text-oc-ink-muted">
                        {" "}
                        — {OUTREACH_STATUS_LABELS[event.fromStatus] ?? event.fromStatus} → {OUTREACH_STATUS_LABELS[event.toStatus] ?? event.toStatus}
                      </span>
                    )}
                  </p>
                  {event.note && <p className="mt-0.5 text-oc-ink-muted">{event.note}</p>}
                  <p className="mt-0.5 text-xs text-oc-ink-muted">
                    {event.createdByName ?? "System"} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {events.length === 0 && <p className="text-sm text-oc-ink-muted">No activity yet.</p>}
            </div>
          </OcCard>
        </div>

        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Industry</dt>
                <dd>{outreach.industry ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Instagram</dt>
                <dd>{outreach.instagramFollowers?.toLocaleString() ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">TikTok</dt>
                <dd>{outreach.tiktokFollowers?.toLocaleString() ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Source</dt>
                <dd>{outreach.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Last follow up</dt>
                <dd>{outreach.lastFollowUpAt ? new Date(outreach.lastFollowUpAt).toLocaleDateString() : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Added</dt>
                <dd>{new Date(outreach.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
            {outreach.website && (
              <Link href={outreach.website} target="_blank" className="mt-3 block text-sm text-oc-700 hover:underline">
                Open website ↗
              </Link>
            )}
            {outreach.instagramUrl && (
              <Link href={outreach.instagramUrl} target="_blank" className="mt-1 block text-sm text-oc-700 hover:underline">
                Open Instagram ↗
              </Link>
            )}
          </OcCard>
        </div>
      </div>
    </div>
  );
}
