"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OcButton, OcCard, OcLinkButton, OutreachStatusBadge } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";
import { KOL_OUTREACH_STATUSES, OUTREACH_STATUS_LABELS } from "@/lib/outreachEnums";

interface OutreachDetail {
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
  notes: string | null;
  lastFollowUpAt: string | null;
  convertedCreatorProfileId: string | null;
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

export default function KolOutreachDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [outreach, setOutreach] = useState<OutreachDetail | null>(null);
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/admin/outreach/kols/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: { outreach: OutreachDetail; events: OutreachEvent[] }) => {
        setOutreach(body.outreach);
        setEvents(body.events);
        setNoteDraft(body.outreach.notes ?? "");
      })
      .catch(() => showToast("Couldn't load this KOL.", "error"));
  }

  useEffect(load, [params.id]);

  // Optimistic: flip the relevant fields locally right away so a status click / follow-up /
  // note save feels instant, then reconcile with the server's authoritative response (or roll
  // back on failure) — instead of re-fetching the whole detail + timeline on every action.
  async function patch(body: Record<string, unknown>, successMessage: string, optimistic?: Partial<OutreachDetail>) {
    const previous = outreach;
    if (optimistic) setOutreach((prev) => (prev ? { ...prev, ...optimistic } : prev));
    setSaving(true);

    const response = await fetch(`/api/admin/outreach/kols/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!response.ok) {
      if (optimistic) setOutreach(previous);
      showToast("That action failed.", "error");
      return;
    }

    const result = await response.json();
    setOutreach((prev) => (prev ? { ...prev, ...result.outreach } : prev));
    if (result.events?.length) setEvents((prev) => [...result.events, ...prev]);
    showToast(successMessage, "success");
  }

  if (!outreach) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-oc-ink">{outreach.kolName}</h1>
            <OutreachStatusBadge status={outreach.status} />
          </div>
          <p className="mt-1 text-sm text-oc-ink-muted">
            PIC: {outreach.picName} · {outreach.email ?? outreach.phone ?? "No contact on file"}
          </p>
        </div>
        {outreach.status === "converted" ? (
          outreach.convertedCreatorProfileId && (
            <OcLinkButton href={`/admin/creators/${outreach.convertedCreatorProfileId}`} variant="secondary">
              View converted profile
            </OcLinkButton>
          )
        ) : (
          <OcLinkButton href={`/admin/outreach/onboard-kol?outreachId=${outreach.id}`}>Convert to Onboarding</OcLinkButton>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Status</p>
            {/* "Converted" is deliberately excluded — it's only ever set by completing Manual
                KOL Onboarding (which also links convertedCreatorProfileId), never as a manual
                pill click. Allowing that here left records in an unreachable dead end: no
                "Convert to Onboarding" link (hidden once status is "converted") and no
                "View converted profile" link (no profile id ever got set). */}
            <div className="mt-2 flex flex-wrap gap-2">
              {KOL_OUTREACH_STATUSES.filter((s) => s !== "converted").map((s) => (
                <button
                  key={s}
                  disabled={saving || s === outreach.status}
                  onClick={() => patch({ status: s }, "Status updated.", { status: s })}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    s === outreach.status ? "border-oc-dark bg-oc-dark text-white" : "border-oc-border hover:bg-oc-bg"
                  }`}
                >
                  {OUTREACH_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {outreach.status !== "converted" && (
              <p className="mt-2 text-xs text-oc-ink-muted">Converted automatically when Manual KOL Onboarding is completed.</p>
            )}
            <OcButton
              variant="secondary"
              className="mt-3"
              disabled={saving}
              onClick={() => patch({ logFollowUp: true }, "Follow up logged.", { lastFollowUpAt: new Date().toISOString() })}
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
              placeholder="Internal notes only — e.g. Interested but waiting until next month."
              className="mt-2 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
            />
            <OcButton className="mt-2" disabled={saving} onClick={() => patch({ notes: noteDraft }, "Note saved.", { notes: noteDraft })}>
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
                <dt className="text-oc-ink-muted">City</dt>
                <dd>{outreach.city ?? "—"}</dd>
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
            {outreach.instagramUrl && (
              <Link href={outreach.instagramUrl} target="_blank" className="mt-3 block text-sm text-oc-700 hover:underline">
                Open Instagram ↗
              </Link>
            )}
            {outreach.tiktokUrl && (
              <Link href={outreach.tiktokUrl} target="_blank" className="mt-1 block text-sm text-oc-700 hover:underline">
                Open TikTok ↗
              </Link>
            )}
          </OcCard>
        </div>
      </div>
    </div>
  );
}
