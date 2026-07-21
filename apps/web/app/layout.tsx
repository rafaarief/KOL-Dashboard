import type { Metadata } from "next";
import { Poppins, Baloo_2 } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });
// Self-hosted via next/font at build time — no remote font request at runtime, so no CLS/regression
// risk. Used for headlines/hero/campaign titles/stat numbers only; Poppins stays the body face
// (see tailwind.config.ts, which maps these to the font-sans/font-display utilities).
const baloo2 = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "OpenCollab.id — Where Brands Meet KOLs",
    template: "%s — OpenCollab.id",
  },
  description:
    "Discover KOL campaigns, publish collaboration opportunities, and connect with brands and KOLs across Indonesia.",
  openGraph: {
    title: "OpenCollab.id — Where Brands Meet KOLs",
    description:
      "Discover KOL campaigns, publish collaboration opportunities, and connect with brands and KOLs across Indonesia.",
    siteName: "OpenCollab.id",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${baloo2.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
