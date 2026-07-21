"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const ACCENTS = {
  coral: "bg-oc-600",
  teal: "bg-oc-teal",
} as const;

export function DashboardSidebar({
  items,
  accent = "coral",
}: {
  items: { href: string; label: string; exact?: boolean }[];
  accent?: keyof typeof ACCENTS;
}) {
  const pathname = usePathname();

  return (
    <div className="rounded-oc-lg bg-oc-dark p-3 lg:sticky lg:top-6 lg:flex lg:h-fit lg:flex-col lg:p-4 lg:py-6">
      <Link href="/" className="mb-2 block px-1 font-display text-lg font-extrabold text-white lg:mb-7 lg:px-2">
        OpenCollab
      </Link>
      <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active ? `${ACCENTS[accent]} text-white` : "text-oc-dark-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-left text-sm font-semibold text-oc-dark-muted hover:bg-white/5 hover:text-white lg:mt-4"
        >
          Log Out
        </button>
      </nav>
    </div>
  );
}
