"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ApplicationStatusBadge, CampaignStatusBadge, OcCard, formatIDR } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

interface Campaign {
  id: string;
  title: string;
  status: string;
  budgetType: string;
  budgetPerCreator: string | null;
  creatorCountNeeded: number;
  creatorCountAccepted: number;
}

interface Applicant {
  id: string;
  status: string;
  pitch: string;
  proposedRate: string | null;
  estimatedDeliveryDays: number | null;
  createdAt: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorCity: string | null;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "rate_desc", label: "Highest proposed rate" },
  { value: "rate_asc", label: "Lowest proposed rate" },
];

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch(`/api/brand/campaigns/${params.id}`)
      .then((res) => res.json())
      .then((body) => setCampaign(body.campaign));
    fetch(`/api/brand/campaigns/${params.id}/applicants`)
      .then((res) => res.json())
      .then((body) => setApplicants(body.results ?? []));
  }

  useEffect(load, [params.id]);

  async function runCampaignAction(action: string, successMessage: string) {
    const response = await fetch(`/api/brand/campaigns/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    showToast(response.ok ? successMessage : "That action isn't available right now.", response.ok ? "success" : "error");
    load();
  }

  async function decide(applicationId: string, status: "shortlisted" | "accepted" | "rejected") {
    setBusyId(applicationId);
    const response = await fetch(`/api/brand/campaigns/${params.id}/applicants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    setBusyId(null);
    showToast(
      response.ok ? `Applicant marked as ${status}.` : "Couldn't update this applicant — it may already be withdrawn.",
      response.ok ? "success" : "error"
    );
    load();
  }

  const visibleApplicants = useMemo(() => {
    let list = applicants;
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((a) => a.creatorDisplayName.toLowerCase().includes(needle) || a.creatorUsername.toLowerCase().includes(needle));
    }
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);

    return [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rate_desc":
          return Number(b.proposedRate ?? 0) - Number(a.proposedRate ?? 0);
        case "rate_asc":
          return Number(a.proposedRate ?? 0) - Number(b.proposedRate ?? 0);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [applicants, q, statusFilter, sort]);

  if (!campaign) return <p className="text-sm text-oc-ink-muted">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-oc-ink">{campaign.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <span className="text-xs text-oc-ink-muted">
              {campaign.creatorCountAccepted}/{campaign.creatorCountNeeded} accepted
            </span>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          {campaign.status === "draft" && (
            <button onClick={() => runCampaignAction("publish", "Campaign published.")} className="rounded-oc-input bg-oc-600 px-3 py-1.5 font-medium text-white">
              Publish
            </button>
          )}
          {campaign.status === "published" && (
            <button onClick={() => runCampaignAction("pause", "Campaign paused.")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button onClick={() => runCampaignAction("resume", "Campaign resumed.")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Resume
            </button>
          )}
          {(campaign.status === "published" || campaign.status === "paused") && (
            <button onClick={() => runCampaignAction("close", "Campaign closed.")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-oc-ink">Applicants ({visibleApplicants.length} of {applicants.length})</h2>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applicants"
          className="w-56 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {["submitted", "viewed", "shortlisted", "accepted", "rejected", "withdrawn"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 space-y-3">
        {visibleApplicants.map((applicant) => (
          <OcCard key={applicant.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-oc-ink">
                  {applicant.creatorDisplayName} <span className="text-oc-ink-muted">@{applicant.creatorUsername}</span>
                </p>
                <p className="text-xs text-oc-ink-muted">{applicant.creatorCity}</p>
              </div>
              <ApplicationStatusBadge status={applicant.status} />
            </div>
            <p className="mt-2 text-sm text-oc-ink-muted">{applicant.pitch}</p>
            <p className="mt-1 text-xs text-oc-ink-muted">
              {applicant.proposedRate ? `Proposed rate: ${formatIDR(applicant.proposedRate)}` : ""}
              {applicant.estimatedDeliveryDays ? ` · Delivery in ${applicant.estimatedDeliveryDays} days` : ""}
            </p>
            {!["accepted", "rejected", "withdrawn"].includes(applicant.status) && (
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  onClick={() => decide(applicant.id, "shortlisted")}
                  disabled={busyId === applicant.id}
                  className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => decide(applicant.id, "accepted")}
                  disabled={busyId === applicant.id}
                  className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => decide(applicant.id, "rejected")}
                  disabled={busyId === applicant.id}
                  className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </OcCard>
        ))}
        {visibleApplicants.length === 0 && applicants.length > 0 && (
          <p className="text-sm text-oc-ink-muted">No applicants match these filters.</p>
        )}
        {applicants.length === 0 && <p className="text-sm text-oc-ink-muted">No applicants yet.</p>}
      </div>
    </div>
  );
}
