"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/creators", label: "Database" },
  { href: "/kols", label: "Nano KOLs" },
  { href: "/history", label: "History" },
  { href: "/shortlists", label: "Shortlists" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-8">
        <span className="text-sm font-semibold tracking-wide text-slate-900">KOL FINDER</span>
        <div className="flex gap-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${
                pathname?.startsWith(link.href) ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
