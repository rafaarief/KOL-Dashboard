export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";
import { slugify } from "@/lib/slugify";
import { AlreadyConvertedError, isUniqueViolation } from "@/lib/pgErrors";

const campaignSchema = z.object({
  title: z.string().min(1).max(160),
  shortDescription: z.string().min(1).max(300),
  fullDescription: z.string().min(1).max(5000),
  budgetType: z.enum(["fixed", "range", "barter", "affiliate", "negotiable"]).default("negotiable"),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
});

const onboardSchema = z.object({
  outreachId: z.string().uuid().optional(),
  email: z.string().email(),
  picPhone: z.string().min(1).max(40),
  picName: z.string().min(1).max(160),
  brandName: z.string().min(1).max(160),
  industry: z.string().max(120).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  logoUrl: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  campaign: campaignSchema.optional(),
});

function generateTemporaryPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = onboardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const email = data.email.toLowerCase().trim();
  const db = getDb();

  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existingUser) return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });

  const platformRows = await db.select().from(schema.platforms);
  const platformIdBySlug = new Map(platformRows.map((p) => [p.slug.toLowerCase(), p.id]));

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hash(temporaryPassword, 10);

  let brandProfileId: string;
  try {
    brandProfileId = await db.transaction(async (tx) => {
      // Claim the outreach record first (see onboard-kol/route.ts for the identical rationale):
      // lock it with FOR UPDATE and abort the whole transaction if it's already converted, so
      // two concurrent submits for the same outreachId can never both create an account.
      let outreachBeforeStatus: string | null = null;
      if (data.outreachId) {
        const [outreach] = await tx.select().from(schema.brandOutreach).where(eq(schema.brandOutreach.id, data.outreachId)).for("update").limit(1);
        if (outreach) {
          if (outreach.status === "converted" || outreach.convertedBrandProfileId) {
            throw new AlreadyConvertedError();
          }
          outreachBeforeStatus = outreach.status;
        }
      }

      const [user] = await tx
        .insert(schema.users)
        .values({
          email,
          fullName: data.picName,
          role: "brand",
          passwordHash,
          manualOnboarding: true,
          manualOnboardedBy: session.user.id,
          manualOnboardedAt: new Date(),
        })
        .returning({ id: schema.users.id });

      const baseSlug = slugify(data.brandName) || `brand-${user.id.slice(0, 8)}`;
      const [existingSlug] = await tx.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.slug, baseSlug)).limit(1);
      const slug = existingSlug ? `${baseSlug}-${user.id.slice(0, 6)}` : baseSlug;

      const [profile] = await tx
        .insert(schema.brandProfiles)
        .values({
          userId: user.id,
          slug,
          brandName: data.brandName,
          industry: data.industry || null,
          website: data.website || null,
          logoUrl: data.logoUrl || null,
          description: data.description || null,
          contactEmail: email,
          picName: data.picName,
          picPhone: data.picPhone,
        })
        .returning({ id: schema.brandProfiles.id });

      const socialAccountRows = [
        data.instagramUrl ? { url: data.instagramUrl, platformSlug: "instagram" } : null,
        data.tiktokUrl ? { url: data.tiktokUrl, platformSlug: "tiktok" } : null,
      ]
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .map((row) => {
          const platformId = platformIdBySlug.get(row.platformSlug);
          return platformId ? { brandProfileId: profile.id, platformId, url: row.url } : null;
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
      if (socialAccountRows.length > 0) await tx.insert(schema.brandSocialAccounts).values(socialAccountRows);

      if (data.campaign) {
        const campaignBaseSlug = slugify(data.campaign.title) || `campaign-${profile.id.slice(0, 8)}`;
        const [existingCampaignSlug] = await tx.select().from(schema.campaigns).where(eq(schema.campaigns.slug, campaignBaseSlug)).limit(1);
        const campaignSlug = existingCampaignSlug ? `${campaignBaseSlug}-${profile.id.slice(0, 6)}` : campaignBaseSlug;

        await tx.insert(schema.campaigns).values({
          brandProfileId: profile.id,
          title: data.campaign.title,
          slug: campaignSlug,
          shortDescription: data.campaign.shortDescription,
          fullDescription: data.campaign.fullDescription,
          budgetType: data.campaign.budgetType,
          budgetMin: data.campaign.budgetMin !== undefined ? String(data.campaign.budgetMin) : null,
          budgetMax: data.campaign.budgetMax !== undefined ? String(data.campaign.budgetMax) : null,
          status: "draft",
        });
      }

      if (data.outreachId && outreachBeforeStatus !== null) {
        await tx
          .update(schema.brandOutreach)
          .set({ status: "converted", statusChangedAt: new Date(), convertedBrandProfileId: profile.id, updatedAt: new Date() })
          .where(eq(schema.brandOutreach.id, data.outreachId));
        await tx.insert(schema.brandOutreachEvents).values({
          brandOutreachId: data.outreachId,
          eventType: "status_changed",
          fromStatus: outreachBeforeStatus,
          toStatus: "converted",
          note: "Converted via Manual Brand Onboarding.",
          createdByUserId: session.user.id,
        });
      }

      return profile.id;
    });
  } catch (error) {
    if (error instanceof AlreadyConvertedError) {
      return NextResponse.json({ error: "ALREADY_CONVERTED" }, { status: 409 });
    }
    if (isUniqueViolation(error, "users_email_unique")) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }
    console.error("Manual Brand onboarding failed", error);
    return NextResponse.json({ error: "ONBOARDING_FAILED" }, { status: 500 });
  }

  await recordAudit({
    actorUserId: session.user.id,
    action: "outreach.onboard_brand",
    entityType: "brand",
    entityId: brandProfileId,
    metadata: { email, outreachId: data.outreachId ?? null, campaignCreated: !!data.campaign },
  });

  return NextResponse.json({ brandProfileId, temporaryPassword }, { status: 201 });
}
