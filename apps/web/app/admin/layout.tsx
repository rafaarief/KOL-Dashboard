import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/oc/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Path-level access (which pages outreach_admin may even reach) is already enforced by
  // middleware's authorized() callback in auth.config.ts — this only decides what the sidebar
  // shows, since AdminSidebar is a client component with no session access of its own.
  const role = session?.user?.role ?? "admin";

  return (
    <div className="min-h-screen bg-oc-bg lg:flex">
      <AdminSidebar role={role} />
      {/* min-w-0 overrides the flex item's default min-width:auto — without it, a flex child
          never shrinks below its content's intrinsic width, so a wide table (min-w-[900px])
          inside pushes the whole page wider than the viewport instead of scrolling within its
          own overflow-x-auto wrapper. */}
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
