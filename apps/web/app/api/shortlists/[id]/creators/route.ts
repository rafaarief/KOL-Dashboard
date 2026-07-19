import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getOrCreateUserId } from "@/lib/currentUser";

const addCreatorSchema = z.object({
  creatorId: z.string().uuid(),
  searchResultId: z.string().uuid().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const db = getDb();
  const entries = await db
    .select({ entry: schema.shortlistCreators, creator: schema.creators })
    .from(schema.shortlistCreators)
    .innerJoin(schema.creators, eq(schema.shortlistCreators.creatorId, schema.creators.id))
    .where(eq(schema.shortlistCreators.shortlistId, params.id));

  return NextResponse.json({ entries });
}

/** FR-016 — save a creator into a shortlist. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = addCreatorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const userId = await getOrCreateUserId(session.email);
  const db = getDb();

  const [entry] = await db
    .insert(schema.shortlistCreators)
    .values({
      shortlistId: params.id,
      creatorId: parsed.data.creatorId,
      searchResultId: parsed.data.searchResultId ?? null,
      addedBy: userId,
    })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}
