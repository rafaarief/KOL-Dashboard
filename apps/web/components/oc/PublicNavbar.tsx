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
    <div className="sticky top-3 z-40 px-3 sm:px-6">
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between rounded-full border border-oc-border bg-white/90 px-4 py-2.5 shadow-oc-sm backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-oc-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-oc-gradient text-sm text-white">
              OC
            </span>
            <span className="hidden sm:inline">
              Open<span className="text-oc-600">Collab</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  pathname?.startsWith(link.href)
                    ? "bg-oc-bg text-oc-700"
                    : "text-oc-ink-muted hover:bg-oc-bg hover:text-oc-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-oc-ink-muted hover:bg-oc-bg hover:text-oc-ink sm:inline"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-oc-border px-4 py-2 text-sm font-medium text-oc-ink hover:bg-oc-bg"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-oc-ink-muted hover:bg-oc-bg hover:text-oc-ink sm:inline"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-oc-dark px-4 py-2 text-sm font-semibold text-white shadow-oc-sm hover:bg-black"
              >
                Join OpenCollab
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
