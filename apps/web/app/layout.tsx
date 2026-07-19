import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
