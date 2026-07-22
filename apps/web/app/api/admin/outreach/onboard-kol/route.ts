export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";
import { normalizeUsername } from "@/lib/slugify";
import { AlreadyConvertedError, isUniqueViolation } from "@/lib/pgErrors";

const socialSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "other"]),
  username: z.string().min(1),
  profileUrl: z.string().optional().or(z.literal("")),
  followerCount: z.number().int().nonnegative().default(0),
});

const rateCardSchema = z.object({
  deliverableType: z.string().min(1),
  price: z.number().nonnegative().optional(),
  visibility: z.enum(["public", "starting_from", "negotiable", "contact"]).default("starting_from"),
});

const onboardSchema = z.object({
  outreachId: z.string().uuid().optional(),
  // Account
  email: z.string().email(),
  phone: z.string().min(1).max(40),
  username: z.string().min(3),
  // Basic Info
  displayName: z.string().min(1).max(160),
  avatarUrl: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  headline: z.string().max(160).optional().or(z.literal("")),
  languages: z.array(z.string()).default([]),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  // Niches
  primaryNicheId: z.string().uuid().optional(),
  // Social
  socialAccounts: z.array(socialSchema).default([]),
  // Collaboration
  acceptsPaid: z.boolean().default(true),
  acceptsBarter: z.boolean().default(false),
  acceptsAffiliate: z.boolean().default(false),
  acceptsAmbassador: z.boolean().default(false),
  acceptsEventAttendance: z.boolean().default(false),
  // Rate card
  rateCards: z.array(rateCardSchema).default([]),
  minimumBudget: z.number().nonnegative().optional(),
  // Portfolio
  portfolioItems: z.array(z.object({ title: z.string().min(1), mediaUrl: z.string().optional().or(z.literal("")), linkUrl: z.string().optional().or(z.literal("")) })).default([]),
  // Brand experience (optional)
  brandExperiences: z.array(z.object({ brandName: z.string().min(1), description: z.string().optional().or(z.literal("")), year: z.number().int().optional() })).default([]),
  // Availability
  availabilityStatus: z.enum(["open", "limited", "fully_booked", "unavailable"]).default("open"),
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
  const username = normalizeUsername(data.username);
  if (username.length < 3) return NextResponse.json({ error: "INVALID_USERNAME" }, { status: 400 });

  const db = getDb();

  // Fast-path checks for a nicer error message on the common case — the transaction below is
  // the actual correctness guarantee (unique constraints + row lock), since a check-then-insert
  // outside a transaction can never fully close a race between two concurrent submits.
  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existingUser) return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });

  const [existingUsername] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.username, username)).limit(1);
  if (existingUsername) return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });

  const platformSlugs = { instagram: "instagram", tiktok: "tiktok", youtube: "youtube", other: "other" } as const;
  const platformRows = await db.select().from(schema.platforms);
  const platformIdBySlug = new Map(platformRows.map((p) => [p.slug.toLowerCase(), p.id]));

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hash(temporaryPassword, 10);

  let creatorProfileId: string;
  try {
    creatorProfileId = await db.transaction(async (tx) => {
      // Claim the outreach record first, before creating any account: SELECT ... FOR UPDATE
      // locks the row so a concurrent submit for the same outreachId blocks here rather than
      // both proceeding to create separate accounts. If it's already converted, abort the whole
      // transaction (including the account we haven't created yet) instead of silently creating
      // an orphaned duplicate.
      let outreachBeforeStatus: string | null = null;
      if (data.outreachId) {
        const [outreach] = await tx.select().from(schema.kolOutreach).where(eq(schema.kolOutreach.id, data.outreachId)).for("update").limit(1);
        if (outreach) {
          if (outreach.status === "converted" || outreach.convertedCreatorProfileId) {
            throw new AlreadyConvertedError();
          }
          outreachBeforeStatus = outreach.status;
        }
      }

      const [user] = await tx
        .insert(schema.users)
        .values({
          email,
          fullName: data.displayName,
          role: "creator",
          passwordHash,
          manualOnboarding: true,
          manualOnboardedBy: session.user.id,
          manualOnboardedAt: new Date(),
        })
        .returning({ id: schema.users.id });

      const [profile] = await tx
        .insert(schema.creatorProfiles)
        .values({
          userId: user.id,
          username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl || null,
          city: data.city || null,
          province: data.province || null,
          bio: data.bio || null,
          headline: data.headline || null,
          languages: data.languages,
          yearsOfExperience: data.yearsOfExperience ?? null,
          primaryNicheId: data.primaryNicheId ?? null,
          availabilityStatus: data.availabilityStatus,
          minimumBudget: data.minimumBudget !== undefined ? String(data.minimumBudget) : null,
          acceptsPaid: data.acceptsPaid,
          acceptsBarter: data.acceptsBarter,
          acceptsAffiliate: data.acceptsAffiliate,
          acceptsAmbassador: data.acceptsAmbassador,
          acceptsEventAttendance: data.acceptsEventAttendance,
          contactEmail: email,
          contactWhatsapp: data.phone,
        })
        .returning({ id: schema.creatorProfiles.id });

      const socialAccountRows = data.socialAccounts
        .map((social) => {
          const platformId = platformIdBySlug.get(platformSlugs[social.platform]);
          if (!platformId) return null;
          return {
            creatorProfileId: profile.id,
            platformId,
            username: social.username,
            profileUrl: social.profileUrl || null,
            followerCount: social.followerCount,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
      if (socialAccountRows.length > 0) await tx.insert(schema.creatorSocialAccounts).values(socialAccountRows);

      if (data.rateCards.length > 0) {
        await tx.insert(schema.creatorRateCards).values(
          data.rateCards.map((rateCard) => ({
            creatorProfileId: profile.id,
            deliverableType: rateCard.deliverableType,
            price: rateCard.price !== undefined ? String(rateCard.price) : null,
            visibility: rateCard.visibility,
          }))
        );
      }

      if (data.portfolioItems.length > 0) {
        await tx.insert(schema.creatorPortfolioItems).values(
          data.portfolioItems.map((item) => ({
            creatorProfileId: profile.id,
            title: item.title,
            mediaUrl: item.mediaUrl || null,
            linkUrl: item.linkUrl || null,
          }))
        );
      }

      if (data.brandExperiences.length > 0) {
        await tx.insert(schema.creatorBrandExperiences).values(
          data.brandExperiences.map((experience) => ({
            creatorProfileId: profile.id,
            brandName: experience.brandName,
            description: experience.description || null,
            year: experience.year ?? null,
          }))
        );
      }

      if (data.outreachId && outreachBeforeStatus !== null) {
        await tx
          .update(schema.kolOutreach)
          .set({ status: "converted", statusChangedAt: new Date(), convertedCreatorProfileId: profile.id, updatedAt: new Date() })
          .where(eq(schema.kolOutreach.id, data.outreachId));
        await tx.insert(schema.kolOutreachEvents).values({
          kolOutreachId: data.outreachId,
          eventType: "status_changed",
          fromStatus: outreachBeforeStatus,
          toStatus: "converted",
          note: "Converted via Manual KOL Onboarding.",
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
    if (isUniqueViolation(error, "creator_profiles_username_unique")) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    console.error("Manual KOL onboarding failed", error);
    return NextResponse.json({ error: "ONBOARDING_FAILED" }, { status: 500 });
  }

  await recordAudit({
    actorUserId: session.user.id,
    action: "outreach.onboard_kol",
    entityType: "creator",
    entityId: creatorProfileId,
    metadata: { email, outreachId: data.outreachId ?? null },
  });

  return NextResponse.json({ creatorProfileId, temporaryPassword }, { status: 201 });
}
