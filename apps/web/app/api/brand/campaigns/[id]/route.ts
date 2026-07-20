export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
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
  publish: { from: ["draft", "paused"], set: { status: "published", publishedAt: new Date() } },
  pause: { from: ["published"], set: { status: "paused" } },
  close: { from: ["published", "paused"], set: { status: "closed" } },
  resume: { from: ["paused"], set: { status: "published" } },
} as const;

/** Brands may only pause/close/republish their OWN campaigns — ownership is enforced via the
 * WHERE clause, not just the request body, so an id from another brand's campaign is a no-op.
 * Each action also only applies from a specific set of prior statuses, so e.g. "publish"
 * can't silently reopen an already-closed campaign. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const brandProfileId = await getOwnBrandProfileId(session.user.id);
  if (!brandProfileId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const action = body?.action as keyof typeof ACTIONS | undefined;
  if (!action || !(action in ACTIONS)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  const { from, set } = ACTIONS[action];
  const [updated] = await db
    .update(schema.campaigns)
    .set({ ...set, updatedAt: new Date() })
    .where(
      and(
        eq(schema.campaigns.id, params.id),
        eq(schema.campaigns.brandProfileId, brandProfileId),
        inArray(schema.campaigns.status, from as unknown as string[])
      )
    )
    .returning({ id: schema.campaigns.id });

  if (!updated) {
    return NextResponse.json({ error: "INVALID_TRANSITION" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
