// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";

const updateEntrySchema = z.object({
  status: z.string().optional(),
  internalNotes: z.string().nullable().optional(),
  proposedDeliverable: z.string().nullable().optional(),
  proposedPrice: z.number().nullable().optional(),
  finalPrice: z.number().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string; entryId: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  // Previously only filtered on entryId — any valid entry could be mutated through any
  // shortlist's URL, since the shortlistId path segment was never checked against it.
  const [entry] = await db
    .update(schema.shortlistCreators)
    .set({
      ...parsed.data,
      proposedPrice: parsed.data.proposedPrice?.toString(),
      finalPrice: parsed.data.finalPrice?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.shortlistCreators.id, params.entryId), eq(schema.shortlistCreators.shortlistId, params.id)))
    .returning();

  if (!entry) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, { params }: { params: { id: string; entryId: string } }) {
  const db = getDb();
  const [deleted] = await db
    .delete(schema.shortlistCreators)
    .where(and(eq(schema.shortlistCreators.id, params.entryId), eq(schema.shortlistCreators.shortlistId, params.id)))
    .returning({ id: schema.shortlistCreators.id });

  if (!deleted) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
