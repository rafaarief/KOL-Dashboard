import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Self-hosted via next/font at build time — no remote font request at runtime, so no CLS/regression
// risk. Used for headlines/hero/campaign titles only; Inter stays the body face (see tailwind.config.ts).
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "OpenCollab.id — Where Brands Meet Creators",
    template: "%s — OpenCollab.id",
  },
  description:
    "Discover creator campaigns, publish collaboration opportunities, and connect with brands and creators across Indonesia.",
  openGraph: {
    title: "OpenCollab.id — Where Brands Meet Creators",
    description:
      "Discover creator campaigns, publish collaboration opportunities, and connect with brands and creators across Indonesia.",
    siteName: "OpenCollab.id",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
