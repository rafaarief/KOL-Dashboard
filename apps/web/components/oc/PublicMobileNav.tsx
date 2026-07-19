"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/marketplace", label: "Market", icon: "▤" },
  { href: "/campaigns", label: "Campaigns", icon: "◎" },
  { href: "/dashboard/creator/saved-campaigns", label: "Saved", icon: "♡" },
  { href: "/login", label: "Profile", icon: "◐" },
];

export function PublicMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-oc-border bg-white/95 backdrop-blur lg:hidden">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              active ? "text-oc-700" : "text-oc-ink-muted"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
