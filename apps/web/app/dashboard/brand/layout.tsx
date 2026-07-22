import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/oc/DashboardSidebar";

export const metadata: Metadata = { title: "Brand Workspace", robots: { index: false, follow: false } };

const TABS = [
  { href: "/dashboard/brand", label: "Overview", exact: true },
  { href: "/dashboard/brand/profile", label: "Brand Profile" },
  { href: "/dashboard/brand/campaigns", label: "Campaigns" },
  { href: "/dashboard/brand/applicants", label: "Collaboration Applicants" },
  { href: "/dashboard/brand/saved-creators", label: "Saved KOLs" },
  { href: "/dashboard/brand/settings", label: "Settings" },
];

export default async function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  // Matches dashboard/creator/layout.tsx's gate — this shell (forms/nav, no protected data) was
  // previously reachable by anyone since it only discovered it was unauthorized when a fetch()
  // to a requireRole-protected API 401'd.
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-oc-bg pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <DashboardSidebar items={TABS} accent="teal" />
        <div>{children}</div>
      </div>
    </div>
  );
}
