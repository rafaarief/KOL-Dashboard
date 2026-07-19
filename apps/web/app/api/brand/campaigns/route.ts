export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { slugify } from "@/lib/slugify";

async function getOwnBrandProfileId(userId: string) {
  const db = getDb();
  const [profile] = await db.select({ id: schema.brandProfiles.id }).from(schema.brandProfiles).where(eq(schema.brandProfiles.userId, userId)).limit(1);
  return profile?.id ?? null;
}

export async function GET() {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const brandProfileId = await getOwnBrandProfileId(session.user.id);
  if (!brandProfileId) return NextResponse.json({ results: [] });

  const db = getDb();
  const rows = await db
    .select({
      id: schema.campaigns.id,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      status: schema.campaigns.status,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      createdAt: schema.campaigns.createdAt,
      applicationCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id)`,
      shortlistedCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id and ca.status = 'shortlisted')`,
      acceptedCount: sql<number>`(select count(*) from campaign_applications ca where ca.campaign_id = campaigns.id and ca.status = 'accepted')`,
    })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.brandProfileId, brandProfileId))
    .orderBy(desc(schema.campaigns.createdAt));

  return NextResponse.json({ results: rows });
}

const createSchema = z.object({
  title: z.string().min(3),
  categoryId: z.string().uuid().optional(),
  shortDescription: z.string().min(10),
  fullDescription: z.string().min(20),
  productOrService: z.string().optional(),
  locationType: z.enum(["remote", "onsite", "hybrid"]).default("remote"),
  city: z.string().optional(),
  isRemote: z.boolean().default(true),
  creatorCountNeeded: z.number().int().positive(),
  budgetType: z.enum(["fixed", "range", "barter", "affiliate", "negotiable"]),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  budgetPerCreator: z.string().optional(),
  compensationType: z.string().default("paid"),
  deliverables: z.array(z.string()).default([]),
  requirements: z.string().optional(),
  minimumFollowers: z.number().int().nonnegative().optional(),
  maximumFollowers: z.number().int().nonnegative().optional(),
  applicationDeadline: z.string().optional(),
  contentDeadline: z.string().optional(),
  campaignStartDate: z.string().optional(),
  campaignEndDate: z.string().optional(),
  publishNow: z.boolean().default(false),
});

export async function POST(request: Request) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const brandProfileId = await getOwnBrandProfileId(session.user.id);
  if (!brandProfileId) return NextResponse.json({ error: "NO_BRAND_PROFILE" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const { publishNow, ...data } = parsed.data;
  const baseSlug = slugify(data.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const db = getDb();
  const [campaign] = await db
    .insert(schema.campaigns)
    .values({
      brandProfileId,
      slug,
      status: publishNow ? "published" : "draft",
      publishedAt: publishNow ? new Date() : null,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      contentDeadline: data.contentDeadline ? new Date(data.contentDeadline) : null,
      campaignStartDate: data.campaignStartDate ? new Date(data.campaignStartDate) : null,
      campaignEndDate: data.campaignEndDate ? new Date(data.campaignEndDate) : null,
      title: data.title,
      categoryId: data.categoryId,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      productOrService: data.productOrService,
      locationType: data.locationType,
      city: data.city,
      isRemote: data.isRemote,
      creatorCountNeeded: data.creatorCountNeeded,
      budgetType: data.budgetType,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      budgetPerCreator: data.budgetPerCreator,
      compensationType: data.compensationType,
      deliverables: data.deliverables,
      requirements: data.requirements,
      minimumFollowers: data.minimumFollowers,
      maximumFollowers: data.maximumFollowers,
    })
    .returning({ id: schema.campaigns.id, slug: schema.campaigns.slug });

  return NextResponse.json({ success: true, campaignId: campaign.id, slug: campaign.slug }, { status: 201 });
}
