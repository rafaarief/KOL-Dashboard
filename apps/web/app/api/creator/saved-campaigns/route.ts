export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      campaignId: schema.savedCampaigns.campaignId,
      savedAt: schema.savedCampaigns.createdAt,
      title: schema.campaigns.title,
      slug: schema.campaigns.slug,
      status: schema.campaigns.status,
      brandName: schema.brandProfiles.brandName,
    })
    .from(schema.savedCampaigns)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.savedCampaigns.campaignId))
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .where(eq(schema.savedCampaigns.userId, session.user.id))
    .orderBy(desc(schema.savedCampaigns.createdAt));

  return NextResponse.json({ results: rows });
}

export async function POST(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db.insert(schema.savedCampaigns).values({ userId: session.user.id, campaignId: id }).onConflictDoNothing();
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db
    .delete(schema.savedCampaigns)
    .where(and(eq(schema.savedCampaigns.userId, session.user.id), eq(schema.savedCampaigns.campaignId, id)));
  return NextResponse.json({ success: true });
}
