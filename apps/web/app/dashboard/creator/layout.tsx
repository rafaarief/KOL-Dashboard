import type { Metadata } from "next";
import Link from "next/link";
import { DashboardTabs } from "@/components/oc/DashboardTabs";

export const metadata: Metadata = { title: "Creator Dashboard", robots: { index: false, follow: false } };

const TABS = [
  { href: "/dashboard/creator", label: "Overview", exact: true },
  { href: "/dashboard/creator/profile", label: "Profile" },
  { href: "/dashboard/creator/availability", label: "Availability" },
  { href: "/dashboard/creator/rates", label: "Rates" },
  { href: "/dashboard/creator/portfolio", label: "Portfolio" },
  { href: "/dashboard/creator/applications", label: "Applications" },
  { href: "/dashboard/creator/saved-campaigns", label: "Saved" },
  { href: "/dashboard/creator/settings", label: "Settings" },
];

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-oc-bg pb-20 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm font-bold text-oc-700">
          OpenCollab<span className="text-oc-ink">.id</span>
        </Link>
        <div className="mt-4">
          <DashboardTabs items={TABS} />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
