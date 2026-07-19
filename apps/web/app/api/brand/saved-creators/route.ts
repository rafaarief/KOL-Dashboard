export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      creatorProfileId: schema.savedCreators.creatorProfileId,
      savedAt: schema.savedCreators.createdAt,
      username: schema.creatorProfiles.username,
      displayName: schema.creatorProfiles.displayName,
      city: schema.creatorProfiles.city,
    })
    .from(schema.savedCreators)
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.savedCreators.creatorProfileId))
    .where(eq(schema.savedCreators.userId, session.user.id))
    .orderBy(desc(schema.savedCreators.createdAt));

  return NextResponse.json({ results: rows });
}

export async function POST(request: Request) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db.insert(schema.savedCreators).values({ userId: session.user.id, creatorProfileId: id }).onConflictDoNothing();
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db
    .delete(schema.savedCreators)
    .where(and(eq(schema.savedCreators.userId, session.user.id), eq(schema.savedCreators.creatorProfileId, id)));
  return NextResponse.json({ success: true });
}
