"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/creators", label: "Creators" },
  { href: "/brands", label: "Brands" },
  { href: "/how-it-works", label: "How It Works" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const dashboardHref =
    session?.user.role === "brand" ? "/dashboard/brand" : session?.user.role === "admin" ? "/admin" : "/dashboard/creator";

  return (
    <nav className="sticky top-0 z-40 border-b border-oc-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-oc-700">
            OpenCollab<span className="text-oc-ink">.id</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname?.startsWith(link.href) ? "text-oc-700" : "text-oc-ink-muted hover:text-oc-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <Link href={dashboardHref} className="hidden text-sm font-medium text-oc-ink-muted hover:text-oc-ink sm:inline">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-oc-input border border-oc-border px-4 py-2 text-sm font-medium text-oc-ink hover:bg-oc-bg"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-medium text-oc-ink-muted hover:text-oc-ink sm:inline">
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-oc-input bg-oc-600 px-4 py-2 text-sm font-medium text-white hover:bg-oc-700"
              >
                Join OpenCollab
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
