export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [profile] = await db
    .select({
      id: schema.creatorProfiles.id,
      userId: schema.creatorProfiles.userId,
      username: schema.creatorProfiles.username,
      displayName: schema.creatorProfiles.displayName,
      headline: schema.creatorProfiles.headline,
      bio: schema.creatorProfiles.bio,
      city: schema.creatorProfiles.city,
      email: schema.users.email,
      userStatus: schema.users.status,
      avatarUrl: schema.creatorProfiles.avatarUrl,
      availabilityStatus: schema.creatorProfiles.availabilityStatus,
      verificationStatus: schema.creatorProfiles.verificationStatus,
      status: schema.creatorProfiles.status,
      featured: schema.creatorProfiles.featured,
      minimumBudget: schema.creatorProfiles.minimumBudget,
      contactEmail: schema.creatorProfiles.contactEmail,
      primaryNicheId: schema.creatorProfiles.primaryNicheId,
      yearsOfExperience: schema.creatorProfiles.yearsOfExperience,
      languages: schema.creatorProfiles.languages,
      createdAt: schema.creatorProfiles.createdAt,
    })
    .from(schema.creatorProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
    .where(eq(schema.creatorProfiles.id, params.id))
    .limit(1);

  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [socialAccounts, rateCards, portfolioItems, brandExperiences, applications, reports] = await Promise.all([
    db.select().from(schema.creatorSocialAccounts).where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id)),
    db.select().from(schema.creatorRateCards).where(eq(schema.creatorRateCards.creatorProfileId, profile.id)),
    db.select().from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, profile.id)),
    db.select().from(schema.creatorBrandExperiences).where(eq(schema.creatorBrandExperiences.creatorProfileId, profile.id)),
    db
      .select({
        id: schema.campaignApplications.id,
        status: schema.campaignApplications.status,
        createdAt: schema.campaignApplications.createdAt,
        campaignTitle: schema.campaigns.title,
        campaignId: schema.campaigns.id,
      })
      .from(schema.campaignApplications)
      .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
      .where(eq(schema.campaignApplications.creatorProfileId, profile.id)),
    db
      .select()
      .from(schema.reports)
      .where(and(eq(schema.reports.targetType, "creator"), eq(schema.reports.targetId, profile.id))),
  ]);

  return NextResponse.json({
    profile,
    socialAccounts,
    rateCards,
    portfolioItems,
    brandExperiences,
    applications,
    reports,
  });
}

const patchSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  city: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  headline: z.string().max(120).optional(),
  availabilityStatus: z.enum(["available", "limited", "unavailable"]).optional(),
  minimumBudget: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });

  const db = getDb();
  const [before] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.id, params.id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db.update(schema.creatorProfiles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.creatorProfiles.id, params.id));

  await recordAudit({
    actorUserId: session.user.id,
    action: "creator.edit",
    entityType: "creator",
    entityId: params.id,
    before: Object.fromEntries(Object.keys(parsed.data).map((k) => [k, (before as Record<string, unknown>)[k]])),
    after: parsed.data,
    request,
  });

  return NextResponse.json({ success: true });
}
