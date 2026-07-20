export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [profile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, session.user.id)).limit(1);
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const socialAccounts = await db
    .select({ id: schema.creatorSocialAccounts.id, platformId: schema.creatorSocialAccounts.platformId, platformName: schema.platforms.name, username: schema.creatorSocialAccounts.username, followerCount: schema.creatorSocialAccounts.followerCount })
    .from(schema.creatorSocialAccounts)
    .innerJoin(schema.platforms, eq(schema.platforms.id, schema.creatorSocialAccounts.platformId))
    .where(eq(schema.creatorSocialAccounts.creatorProfileId, profile.id));

  const niches = await db.select().from(schema.niches);

  const secondaryNiches = await db
    .select({ nicheId: schema.creatorNiches.nicheId })
    .from(schema.creatorNiches)
    .where(eq(schema.creatorNiches.creatorProfileId, profile.id));

  return NextResponse.json({ profile, socialAccounts, niches, secondaryNicheIds: secondaryNiches.map((n) => n.nicheId) });
}

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  headline: z.string().max(120).optional(),
  languages: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  primaryNicheId: z.string().uuid().optional(),
  secondaryNicheIds: z.array(z.string().uuid()).max(5).optional(),
  availabilityStatus: z.enum(["open", "limited", "fully_booked", "unavailable"]).optional(),
  monthlyCapacity: z.number().int().nonnegative().optional(),
  slotsRemaining: z.number().int().nonnegative().optional(),
  minimumBudget: z.string().optional(),
  acceptsBarter: z.boolean().optional(),
  acceptsAffiliate: z.boolean().optional(),
  acceptsPaid: z.boolean().optional(),
  acceptsEventAttendance: z.boolean().optional(),
  acceptsAmbassador: z.boolean().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactWhatsapp: z.string().optional(),
  contactVisible: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const { secondaryNicheIds, ...profileFields } = parsed.data;
  const db = getDb();

  const [profile] = await db
    .select({ id: schema.creatorProfiles.id, primaryNicheId: schema.creatorProfiles.primaryNicheId })
    .from(schema.creatorProfiles)
    .where(eq(schema.creatorProfiles.userId, session.user.id))
    .limit(1);
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (Object.keys(profileFields).length > 0) {
    await db
      .update(schema.creatorProfiles)
      .set({ ...profileFields, updatedAt: new Date() })
      .where(eq(schema.creatorProfiles.id, profile.id));
  }

  if (secondaryNicheIds) {
    // Small, bounded set (max 5) — replace-all is simpler and safer than diffing, and this
    // is a low-frequency write (profile editing, not a hot path).
    const effectivePrimaryNicheId = parsed.data.primaryNicheId ?? profile.primaryNicheId;
    await db.delete(schema.creatorNiches).where(eq(schema.creatorNiches.creatorProfileId, profile.id));
    const uniqueIds = [...new Set(secondaryNicheIds)].filter((id) => id !== effectivePrimaryNicheId);
    if (uniqueIds.length > 0) {
      await db.insert(schema.creatorNiches).values(uniqueIds.map((nicheId) => ({ creatorProfileId: profile.id, nicheId })));
    }
  }

  return NextResponse.json({ success: true });
}
