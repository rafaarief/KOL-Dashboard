"use client";

import { OcBadge, OcCard, Pagination } from "@/components/oc/primitives";
import { useFilteredList } from "@/lib/useFilteredList";

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const { rows, total, page, setPage, totalPages } = useFilteredList<UserRow>("/api/admin/users", {});

  return (
    <div>
      <h1 className="text-xl font-semibold text-oc-ink">Users</h1>
      <p className="mt-1 text-sm text-oc-ink-muted">{total.toLocaleString()} accounts across every role.</p>

      <OcCard className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-oc-border bg-oc-bg text-xs uppercase tracking-wide text-oc-ink-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last login</th>
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
                <td className="px-4 py-3 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OcCard>

      <Pagination page={page} totalPages={totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
    </div>
  );
}
