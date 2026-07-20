import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  { path: "", priority: 1 },
  { path: "/marketplace", priority: 0.8 },
  { path: "/campaigns", priority: 0.8 },
  { path: "/creators", priority: 0.8 },
  { path: "/brands", priority: 0.7 },
  { path: "/how-it-works", priority: 0.5 },
  { path: "/about", priority: 0.4 },
  { path: "/pricing", priority: 0.4 },
  { path: "/register", priority: 0.6 },
  { path: "/register/creator", priority: 0.6 },
  { path: "/register/brand", priority: 0.6 },
  { path: "/login", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://opencollab.id";
  const db = getDb();

  const [campaigns, creators, brands] = await Promise.all([
    db
      .select({ slug: schema.campaigns.slug, updatedAt: schema.campaigns.updatedAt })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.status, "published")),
    db
      .select({ username: schema.creatorProfiles.username, updatedAt: schema.creatorProfiles.updatedAt })
      .from(schema.creatorProfiles)
      .where(eq(schema.creatorProfiles.status, "active")),
    db
      .select({ slug: schema.brandProfiles.slug, updatedAt: schema.brandProfiles.updatedAt })
      .from(schema.brandProfiles)
      .where(eq(schema.brandProfiles.status, "active")),
  ]);

  return [
    ...STATIC_PATHS.map(({ path, priority }) => ({
      url: `${base}${path}`,
      changeFrequency: "daily" as const,
      priority,
    })),
    ...campaigns.map((c) => ({
      url: `${base}/campaigns/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...creators.map((c) => ({
      url: `${base}/creators/${c.username}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...brands.map((b) => ({
      url: `${base}/brands/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
