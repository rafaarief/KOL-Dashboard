"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApplicationStatusBadge, CampaignStatusBadge, OcButton, OcCard, formatIDR } from "@/components/oc/primitives";

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
  creatorUsername: string;
  creatorDisplayName: string;
  creatorCity: string | null;
}

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  function load() {
    fetch(`/api/brand/campaigns/${params.id}`)
      .then((res) => res.json())
      .then((body) => setCampaign(body.campaign));
    fetch(`/api/brand/campaigns/${params.id}/applicants`)
      .then((res) => res.json())
      .then((body) => setApplicants(body.results ?? []));
  }

  useEffect(load, [params.id]);

  async function runCampaignAction(action: string) {
    await fetch(`/api/brand/campaigns/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function decide(applicationId: string, status: "shortlisted" | "accepted" | "rejected") {
    await fetch(`/api/brand/campaigns/${params.id}/applicants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    load();
  }

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
            <button onClick={() => runCampaignAction("publish")} className="rounded-oc-input bg-oc-600 px-3 py-1.5 font-medium text-white">
              Publish
            </button>
          )}
          {campaign.status === "published" && (
            <button onClick={() => runCampaignAction("pause")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button onClick={() => runCampaignAction("resume")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Resume
            </button>
          )}
          {(campaign.status === "published" || campaign.status === "paused") && (
            <button onClick={() => runCampaignAction("close")} className="rounded-oc-input border border-oc-border px-3 py-1.5">
              Close
            </button>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-oc-ink">Applicants ({applicants.length})</h2>
      <div className="mt-3 space-y-3">
        {applicants.map((applicant) => (
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
                <button onClick={() => decide(applicant.id, "shortlisted")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                  Shortlist
                </button>
                <button onClick={() => decide(applicant.id, "accepted")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                  Accept
                </button>
                <button onClick={() => decide(applicant.id, "rejected")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                  Reject
                </button>
              </div>
            )}
          </OcCard>
        ))}
        {applicants.length === 0 && <p className="text-sm text-oc-ink-muted">No applicants yet.</p>}
      </div>
    </div>
  );
}
