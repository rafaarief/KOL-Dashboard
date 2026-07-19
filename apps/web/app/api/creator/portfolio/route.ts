export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

async function getOwnCreatorProfileId(userId: string) {
  const db = getDb();
  const [profile] = await db.select({ id: schema.creatorProfiles.id }).from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, userId)).limit(1);
  return profile?.id ?? null;
}

export async function GET() {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const creatorProfileId = await getOwnCreatorProfileId(session.user.id);
  if (!creatorProfileId) return NextResponse.json({ results: [] });

  const db = getDb();
  const rows = await db.select().from(schema.creatorPortfolioItems).where(eq(schema.creatorPortfolioItems.creatorProfileId, creatorProfileId));
  return NextResponse.json({ results: rows });
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  linkUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const creatorProfileId = await getOwnCreatorProfileId(session.user.id);
  if (!creatorProfileId) return NextResponse.json({ error: "NO_CREATOR_PROFILE" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db.insert(schema.creatorPortfolioItems).values({ creatorProfileId, ...parsed.data });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["creator"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const creatorProfileId = await getOwnCreatorProfileId(session.user.id);
  if (!creatorProfileId) return NextResponse.json({ error: "NO_CREATOR_PROFILE" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db.delete(schema.creatorPortfolioItems).where(and(eq(schema.creatorPortfolioItems.id, id), eq(schema.creatorPortfolioItems.creatorProfileId, creatorProfileId)));
  return NextResponse.json({ success: true });
}
