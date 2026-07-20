"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApplicationStatusBadge, CampaignStatusBadge, OcCard, formatIDR } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";
import { ConfirmModal } from "@/components/oc/ConfirmModal";

interface CampaignDetail {
  campaign: {
    id: string;
    title: string;
    slug: string;
    status: string;
    shortDescription: string;
    fullDescription: string;
    budgetType: string;
    budgetPerCreator: string | null;
    creatorCountNeeded: number;
    creatorCountAccepted: number;
    featured: boolean;
    coverImageUrl: string | null;
    brandName: string;
    brandSlug: string;
    createdAt: string;
  };
  applicants: {
    id: string;
    status: string;
    proposedRate: string | null;
    createdAt: string;
    creatorId: string;
    creatorUsername: string;
    creatorDisplayName: string;
  }[];
}

const NEXT_ACTIONS: Record<string, { action: string; label: string }[]> = {
  draft: [
    { action: "approve", label: "Approve & Publish" },
    { action: "reject", label: "Reject" },
  ],
  published: [
    { action: "pause", label: "Pause" },
    { action: "close", label: "Close" },
  ],
  paused: [
    { action: "resume", label: "Resume" },
    { action: "close", label: "Close" },
  ],
  closed: [],
  rejected: [],
};

export default function AdminCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [busyApplicant, setBusyApplicant] = useState<string | null>(null);

  function load() {
    fetch(`/api/admin/campaigns/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: CampaignDetail) => {
        setData(body);
        setForm({
          title: body.campaign.title,
          shortDescription: body.campaign.shortDescription,
          fullDescription: body.campaign.fullDescription,
        });
      })
      .catch(() => showToast("Couldn't load this campaign.", "error"));
  }

  useEffect(load, [params.id]);

  async function runTransition(action: string) {
    const response = await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, action }),
    });
    const payload = await response.json().catch(() => ({}));
    showToast(response.ok ? "Campaign updated." : payload.message ?? "That action failed.", response.ok ? "success" : "error");
    setConfirmReopen(false);
    load();
  }

  async function saveEdits() {
    setSaving(true);
    const response = await fetch(`/api/admin/campaigns/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    showToast(response.ok ? "Campaign updated." : "Save failed.", response.ok ? "success" : "error");
    load();
  }

  async function decideApplicant(applicationId: string, status: string) {
    setBusyApplicant(applicationId);
    const response = await fetch(`/api/admin/campaigns/${params.id}/applicants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    setBusyApplicant(null);
    showToast(response.ok ? `Applicant marked ${status}.` : "That action failed.", response.ok ? "success" : "error");
    load();
  }

  if (!data) return <p className="text-sm text-oc-ink-muted">Loading…</p>;
  const { campaign } = data;
  const nextActions = NEXT_ACTIONS[campaign.status] ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-oc-ink">{campaign.title}</h1>
            <CampaignStatusBadge status={campaign.status} />
            {campaign.featured && <span className="text-xs font-semibold text-oc-700">★ Featured</span>}
          </div>
          <p className="mt-1 text-sm text-oc-ink-muted">
            {campaign.brandName} ·{" "}
            <Link href={`/campaigns/${campaign.slug}`} className="text-oc-700 hover:underline" target="_blank">
              View public page ↗
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {nextActions.map((a) => (
            <button key={a.action} onClick={() => runTransition(a.action)} className="rounded border border-oc-border px-2.5 py-1.5 hover:bg-oc-bg">
              {a.label}
            </button>
          ))}
          <button
            onClick={() => runTransition(campaign.featured ? "unfeature" : "feature")}
            className="rounded border border-oc-border px-2.5 py-1.5 hover:bg-oc-bg"
          >
            {campaign.featured ? "Unfeature" : "Feature"}
          </button>
          {(campaign.status === "closed" || campaign.status === "rejected") && (
            <button onClick={() => setConfirmReopen(true)} className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-amber-800 hover:bg-amber-100">
              Reopen (override)
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Edit campaign</p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="text-xs text-oc-ink-muted">
                Title
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted">
                Short description
                <input
                  value={form.shortDescription ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
              <label className="text-xs text-oc-ink-muted">
                Full description
                <textarea
                  rows={4}
                  value={form.fullDescription ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, fullDescription: e.target.value }))}
                  className="mt-1 w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm text-oc-ink"
                />
              </label>
            </div>
            <button
              onClick={saveEdits}
              disabled={saving}
              className="mt-3 rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </OcCard>

          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">Applicants ({data.applicants.length})</p>
            <div className="mt-3 divide-y divide-oc-border">
              {data.applicants.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link href={`/admin/creators/${a.creatorId}`} className="font-medium text-oc-ink hover:underline">
                      {a.creatorDisplayName}
                    </Link>
                    <p className="text-xs text-oc-ink-muted">
                      @{a.creatorUsername} · {a.proposedRate ? formatIDR(a.proposedRate) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={a.status} />
                    {!["accepted", "rejected", "withdrawn"].includes(a.status) && (
                      <div className="flex gap-1 text-xs">
                        <button
                          disabled={busyApplicant === a.id}
                          onClick={() => decideApplicant(a.id, "shortlisted")}
                          className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                        >
                          Shortlist
                        </button>
                        <button
                          disabled={busyApplicant === a.id}
                          onClick={() => decideApplicant(a.id, "accepted")}
                          className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          disabled={busyApplicant === a.id}
                          onClick={() => decideApplicant(a.id, "rejected")}
                          className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.applicants.length === 0 && <p className="py-2 text-sm text-oc-ink-muted">No applicants yet.</p>}
            </div>
          </OcCard>
        </div>

        <div className="space-y-4">
          <OcCard className="p-5">
            <p className="text-sm font-semibold text-oc-ink">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Budget</dt>
                <dd>{campaign.budgetPerCreator ? formatIDR(campaign.budgetPerCreator) : campaign.budgetType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Slots</dt>
                <dd>
                  {campaign.creatorCountAccepted}/{campaign.creatorCountNeeded}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-oc-ink-muted">Created</dt>
                <dd>{new Date(campaign.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </OcCard>
        </div>
      </div>

      <ConfirmModal
        open={confirmReopen}
        title="Reopen this campaign?"
        description={`This is an override — "${campaign.title}" is currently ${campaign.status} and wouldn't normally be reopenable. This action is recorded in the audit log.`}
        confirmLabel="Reopen as draft"
        tone="danger"
        onConfirm={() => runTransition("admin_reopen")}
        onCancel={() => setConfirmReopen(false)}
      />
    </div>
  );
}
