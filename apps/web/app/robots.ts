import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://opencollab.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin and authenticated dashboards are also middleware-gated and have
        // `robots: { index: false }` on their own metadata — this is belt-and-suspenders.
        disallow: ["/admin", "/dashboard", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
