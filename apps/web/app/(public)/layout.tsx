import { PublicNavbar } from "@/components/oc/PublicNavbar";
import { PublicMobileNav } from "@/components/oc/PublicMobileNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-oc-bg">
      <PublicNavbar />
      <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-6 sm:px-6 lg:pb-10">{children}</main>
      <PublicMobileNav />
    </div>
  );
}
