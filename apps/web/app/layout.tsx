import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOL Finder",
  description: "Internal TikTok KOL sourcing dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
