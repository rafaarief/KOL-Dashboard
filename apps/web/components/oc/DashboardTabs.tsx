"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function DashboardTabs({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-oc-border">
      <nav className="flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                active ? "border-oc-600 text-oc-700" : "border-transparent text-oc-ink-muted hover:text-oc-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="hidden shrink-0 text-xs text-oc-ink-muted hover:text-oc-ink sm:block">
        Log Out
      </button>
    </div>
  );
}
