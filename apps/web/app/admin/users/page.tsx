"use client";

import { useState } from "react";
import { OcBadge, OcCard, Pagination } from "@/components/oc/primitives";
import { useDebouncedValue, useFilteredList } from "@/lib/useFilteredList";
import { useToast } from "@/components/oc/Toast";
import { ConfirmModal } from "@/components/oc/ConfirmModal";

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLES = ["creator", "brand", "admin"] as const;

type PendingAction =
  | { kind: "suspend" | "reactivate"; row: UserRow }
  | { kind: "change_role"; row: UserRow; role: string };

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const { rows, total, page, setPage, totalPages, isLoading, error, reload } = useFilteredList<UserRow>("/api/admin/users", {
    q: debouncedQ,
    role,
    status,
  });
  const { showToast } = useToast();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: PendingAction) {
    setBusy(true);
    const body: Record<string, string> = { id: action.row.id, action: action.kind };
    if (action.kind === "change_role") body.role = action.role;

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    setPending(null);
    showToast(response.ok ? "User updated." : payload.message ?? "That action failed.", response.ok ? "success" : "error");
    reload();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Users</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} accounts across every role.</p>
      {error && <div className="mt-4 rounded-oc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="w-64 rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-oc-input border border-oc-border bg-oc-bg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oc-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-oc-ink">{row.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-oc-ink-muted">{row.email}</td>
                <td className="px-4 py-3">
                  <OcBadge tone={row.role === "admin" ? "purple" : "neutral"}>{row.role}</OcBadge>
                </td>
                <td className="px-4 py-3">
                  <OcBadge tone={row.status === "suspended" ? "danger" : "success"}>{row.status}</OcBadge>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setPending({ kind: row.status === "suspended" ? "reactivate" : "suspend", row })}
                      className="rounded border border-oc-border px-2 py-1 hover:bg-oc-bg"
                    >
                      {row.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) setPending({ kind: "change_role", row, role: e.target.value });
                        e.target.value = "";
                      }}
                      className="rounded border border-oc-border bg-oc-bg px-1.5 py-1"
                    >
                      <option value="" disabled>
                        Change role…
                      </option>
                      {ROLES.filter((r) => r !== row.role).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-oc-ink-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </OcCard>

      <Pagination page={page} totalPages={totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />

      <ConfirmModal
        open={pending !== null}
        title={
          pending?.kind === "suspend"
            ? "Suspend this account?"
            : pending?.kind === "reactivate"
              ? "Reactivate this account?"
              : `Change role to ${pending?.kind === "change_role" ? pending.role : ""}?`
        }
        description={
          pending?.kind === "suspend"
            ? `${pending.row.email} will be signed out and unable to log in until reactivated.`
            : pending?.kind === "reactivate"
              ? `${pending.row.email} will be able to log in again.`
              : pending?.kind === "change_role"
                ? `${pending.row.email} will immediately gain ${pending.role} permissions on next login/session refresh.`
                : ""
        }
        confirmLabel={pending?.kind === "suspend" ? "Suspend" : "Confirm"}
        tone={pending?.kind === "suspend" ? "danger" : "default"}
        busy={busy}
        onConfirm={() => pending && runAction(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
