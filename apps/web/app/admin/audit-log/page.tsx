"use client";

import { useState } from "react";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { OcCard, Pagination } from "@/components/oc/primitives";

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeState: unknown;
  afterState: unknown;
  metadata: unknown;
  createdAt: string;
  actorEmail: string | null;
}

function summarizeChange(before: unknown, after: unknown): string {
  if (!before && !after) return "";
  try {
    const b = before as Record<string, unknown> | null;
    const a = after as Record<string, unknown> | null;
    if (!a) return "";
    const keys = Object.keys(a);
    return keys.map((k) => `${k}: ${b?.[k] ?? "—"} → ${a[k]}`).join(", ");
  } catch {
    return "";
  }
}

export default function AdminAuditLogPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const debouncedActor = useDebouncedValue(actor);
  const debouncedAction = useDebouncedValue(action);
  const { rows, total, page, setPage, totalPages, isLoading, error } = useFilteredList<AuditLogRow>("/api/admin/audit-log", {
    actor: debouncedActor,
    action: debouncedAction,
    entityType,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Audit Log</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} recorded admin actions — who changed what, and when.</p>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Admin email"
          className="w-56 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Action contains…"
          className="w-56 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All entity types</option>
          {["user", "creator", "brand", "campaign", "application", "report", "category", "niche", "platform", "collaborationType"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.actorEmail ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-oc-ink">{row.action}</td>
                <td className="px-4 py-3 text-xs text-oc-ink-muted">
                  {row.entityType}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-oc-ink-muted">{summarizeChange(row.beforeState, row.afterState) || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-oc-ink-muted">
                  No matching audit log entries.
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
