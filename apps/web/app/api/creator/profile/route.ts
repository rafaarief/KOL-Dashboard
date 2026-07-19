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

  return NextResponse.json({ profile, socialAccounts, niches });
}

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  primaryNicheId: z.string().uuid().optional(),
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

  const db = getDb();
  await db
    .update(schema.creatorProfiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.creatorProfiles.userId, session.user.id));

  return NextResponse.json({ success: true });
}
