import type { Metadata } from "next";
import { AdminSidebar } from "@/components/oc/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-oc-bg lg:flex">
      <AdminSidebar />
      {/* min-w-0 overrides the flex item's default min-width:auto — without it, a flex child
          never shrinks below its content's intrinsic width, so a wide table (min-w-[900px])
          inside pushes the whole page wider than the viewport instead of scrolling within its
          own overflow-x-auto wrapper. */}
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
