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
    <div className="flex h-fit flex-col rounded-oc-lg bg-oc-dark px-4 py-6 lg:sticky lg:top-6">
      <Link href="/" className="mb-7 px-2 font-display text-lg font-extrabold text-white">
        OpenCollab
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active ? `${ACCENTS[accent]} text-white` : "text-oc-dark-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-oc-dark-muted hover:bg-white/5 hover:text-white"
      >
        Log Out
      </button>
    </div>
  );
}
