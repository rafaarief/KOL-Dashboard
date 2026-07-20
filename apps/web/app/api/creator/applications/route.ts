export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

async function getOwnCreatorProfile(userId: string) {
  const db = getDb();
  const [profile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function GET() {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await getOwnCreatorProfile(session.user.id);
  if (!profile) return NextResponse.json({ results: [] });

  const db = getDb();
  const rows = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      proposedRate: schema.campaignApplications.proposedRate,
      createdAt: schema.campaignApplications.createdAt,
      campaignTitle: schema.campaigns.title,
      campaignSlug: schema.campaigns.slug,
      applicationDeadline: schema.campaigns.applicationDeadline,
      brandName: schema.brandProfiles.brandName,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .where(eq(schema.campaignApplications.creatorProfileId, profile.id))
    .orderBy(desc(schema.campaignApplications.createdAt));

  return NextResponse.json({ results: rows });
}

const applySchema = z.object({
  campaignId: z.string().uuid(),
  pitch: z.string().min(10),
  proposedRate: z.string().optional(),
  selectedSocialAccountId: z.string().uuid().optional(),
  portfolioLinks: z.array(z.string().url()).default([]),
  estimatedDeliveryDays: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await getOwnCreatorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "NO_CREATOR_PROFILE" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const db = getDb();

  const [campaign] = await db
    .select({ status: schema.campaigns.status, applicationDeadline: schema.campaigns.applicationDeadline })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, parsed.data.campaignId))
    .limit(1);

  if (!campaign || campaign.status !== "published") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_OPEN" }, { status: 400 });
  }
  if (campaign.applicationDeadline && new Date(campaign.applicationDeadline) < new Date()) {
    return NextResponse.json({ error: "APPLICATION_DEADLINE_PASSED" }, { status: 400 });
  }

  try {
    await db.insert(schema.campaignApplications).values({
      campaignId: parsed.data.campaignId,
      creatorProfileId: profile.id,
      pitch: parsed.data.pitch,
      proposedRate: parsed.data.proposedRate,
      selectedSocialAccountId: parsed.data.selectedSocialAccountId,
      portfolioLinks: parsed.data.portfolioLinks,
      estimatedDeliveryDays: parsed.data.estimatedDeliveryDays,
      note: parsed.data.note,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("campaign_applications_unique_idx") || message.includes("duplicate key")) {
      return NextResponse.json({ error: "ALREADY_APPLIED" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

/** Creators may withdraw their own still-pending ("submitted") application only. */
export async function PATCH(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await getOwnCreatorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "NO_CREATOR_PROFILE" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.campaignApplications)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(
      and(
        eq(schema.campaignApplications.id, id),
        eq(schema.campaignApplications.creatorProfileId, profile.id),
        eq(schema.campaignApplications.status, "submitted")
      )
    );

  return NextResponse.json({ success: true });
}
