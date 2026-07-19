export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

async function getOwnBrandProfileId(userId: string) {
  const db = getDb();
  const [profile] = await db.select({ id: schema.brandProfiles.id }).from(schema.brandProfiles).where(eq(schema.brandProfiles.userId, userId)).limit(1);
  return profile?.id ?? null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const brandProfileId = await getOwnBrandProfileId(session.user.id);
  if (!brandProfileId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const db = getDb();
  const [campaign] = await db
    .select()
    .from(schema.campaigns)
    .where(and(eq(schema.campaigns.id, params.id), eq(schema.campaigns.brandProfileId, brandProfileId)))
    .limit(1);

  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ campaign });
}

const ACTIONS = {
  publish: { status: "published", publishedAt: new Date() },
  pause: { status: "paused" },
  close: { status: "closed" },
  resume: { status: "published" },
} as const;

/** Brands may only pause/close/republish their OWN campaigns — ownership is enforced via the
 * WHERE clause, not just the request body, so an id from another brand's campaign is a no-op. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const brandProfileId = await getOwnBrandProfileId(session.user.id);
  if (!brandProfileId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const action = body?.action as keyof typeof ACTIONS | undefined;
  if (!action || !(action in ACTIONS)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.campaigns)
    .set({ ...ACTIONS[action], updatedAt: new Date() })
    .where(and(eq(schema.campaigns.id, params.id), eq(schema.campaigns.brandProfileId, brandProfileId)));

  return NextResponse.json({ success: true });
}
