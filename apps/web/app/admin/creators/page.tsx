"use client";

import { useState } from "react";
import Link from "next/link";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { Avatar, AvailabilityBadge, OcCard, Pagination, VerificationBadge } from "@/components/oc/primitives";
import { useToast } from "@/components/oc/Toast";

const ACTION_LABELS: Record<string, string> = {
  verify: "KOL verified.",
  reject_verification: "Verification rejected.",
  suspend: "KOL suspended.",
  reactivate: "KOL reactivated.",
  feature: "KOL featured.",
  unfeature: "KOL unfeatured.",
};

interface AdminCreatorRow {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  email: string;
  availabilityStatus: string;
  verificationStatus: string;
  status: string;
  featured: boolean;
  createdAt: string;
}

export default function AdminCreatorsPage() {
  const [q, setQ] = useState("");
  const [verification, setVerification] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error, reload } = useFilteredList<AdminCreatorRow>(
    "/api/admin/creators",
    { q: debouncedQ, verification }
  );
  const { showToast } = useToast();

  async function runAction(id: string, action: string) {
    const response = await fetch("/api/admin/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    showToast(response.ok ? ACTION_LABELS[action] ?? "Updated." : "That action failed.", response.ok ? "success" : "error");
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-oc-ink">KOLs</h1>
          <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} KOL accounts.</p>
        </div>
        <a href="/api/admin/creators?format=csv" className="rounded-oc-input border border-oc-border px-3.5 py-1.5 text-sm hover:bg-oc-bg">
          Export CSV
        </a>
      </div>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or username"
          className="w-64 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select
          value={verification}
          onChange={(e) => setVerification(e.target.value)}
          className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        >
          <option value="">All verification</option>
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">KOL</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.displayName} url={row.avatarUrl} size={32} />
                    <div>
                      <Link href={`/admin/creators/${row.id}`} className="font-medium text-oc-ink hover:underline">
                        {row.displayName}
                      </Link>
                      <p className="text-xs text-oc-ink-muted">@{row.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.email}</td>
                <td className="px-4 py-3">{row.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <AvailabilityBadge status={row.availabilityStatus} />
                </td>
                <td className="px-4 py-3">
                  <VerificationBadge status={row.verificationStatus} />
                  {row.verificationStatus !== "verified" && <span className="text-xs text-oc-ink-muted">{row.verificationStatus}</span>}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button onClick={() => runAction(row.id, "verify")} className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg">
                      Verify
                    </button>
                    <button
                      onClick={() => runAction(row.id, row.status === "suspended" ? "reactivate" : "suspend")}
                      className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                    >
                      {row.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => runAction(row.id, row.featured ? "unfeature" : "feature")}
                      className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                    >
                      {row.featured ? "Unfeature" : "Feature"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-oc-ink-muted">
                  No KOLs found.
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
