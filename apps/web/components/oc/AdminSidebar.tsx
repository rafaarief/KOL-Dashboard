"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const NAV_GROUPS = [
  {
    label: "OpenCollab",
    items: [
      { href: "/admin", label: "Overview", exact: true },
      { href: "/admin/creators", label: "Creators" },
      { href: "/admin/brands", label: "Brands" },
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/applications", label: "Applications" },
      { href: "/admin/categories", label: "Categories & Niches" },
      { href: "/admin/verifications", label: "Verifications" },
      { href: "/admin/reports", label: "Reports" },
    ],
  },
  {
    label: "Growth & Operations",
    items: [
      { href: "/admin/kol-finder", label: "KOL Finder", exact: true },
      { href: "/admin/kol-finder/search", label: "Search by Keyword" },
      { href: "/admin/kol-finder/database", label: "KOL Database" },
      { href: "/admin/kol-finder/history", label: "Search History" },
      { href: "/admin/kol-finder/shortlists", label: "Saved Lists" },
      { href: "/admin/kol-finder/nano-kols", label: "Nano KOL Directory" },
      { href: "/admin/business-leads", label: "Business Leads" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit-log", label: "Audit Log" },
    ],
  },
];

function isActive(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-oc-ink-muted">{group.label}</p>
          <div className="mt-1 space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-oc-input px-3 py-2 text-sm ${
                  isActive(pathname, item.href, item.exact)
                    ? "bg-oc-300/20 font-medium text-oc-700"
                    : "text-oc-ink-muted hover:bg-oc-bg hover:text-oc-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-oc-border bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-sm font-bold text-oc-700">
          OpenCollab Admin
        </Link>
        <button onClick={() => setOpen((v) => !v)} className="rounded-oc-input border border-oc-border px-3 py-1.5 text-sm">
          Menu
        </button>
      </div>

      {open && (
        <div className="border-b border-oc-border bg-white px-4 py-3 lg:hidden">
          {nav}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 w-full rounded-oc-input border border-oc-border px-3 py-2 text-left text-sm text-oc-ink-muted"
          >
            Log Out
          </button>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-oc-border bg-white px-3 py-6 lg:block">
        <Link href="/admin" className="block px-3 pb-6 text-sm font-bold text-oc-700">
          OpenCollab Admin
        </Link>
        {nav}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-6 w-full rounded-oc-input border border-oc-border px-3 py-2 text-left text-sm text-oc-ink-muted hover:bg-oc-bg"
        >
          Log Out
        </button>
      </aside>
    </>
  );
}
