"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/kols", label: "Nano KOLs" },
  { href: "/search", label: "Search" },
  { href: "/history", label: "History" },
  { href: "/shortlists", label: "Shortlists" },
  { href: "/leads", label: "Leads" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div className="flex items-center gap-8">
        <span className="text-sm font-semibold tracking-wide text-slate-100">KOL FINDER</span>
        <div className="flex gap-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${
                pathname?.startsWith(link.href) ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-200">
        Sign out
      </button>
    </nav>
  );
}
