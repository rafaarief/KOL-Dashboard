import type { Metadata } from "next";
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

export default function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-oc-bg pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <DashboardSidebar items={TABS} accent="teal" />
        <div>{children}</div>
      </div>
    </div>
  );
}
