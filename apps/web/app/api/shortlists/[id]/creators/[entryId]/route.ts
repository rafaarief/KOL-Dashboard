import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";

const updateEntrySchema = z.object({
  status: z.string().optional(),
  internalNotes: z.string().nullable().optional(),
  proposedDeliverable: z.string().nullable().optional(),
  proposedPrice: z.number().nullable().optional(),
  finalPrice: z.number().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { entryId: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  const [entry] = await db
    .update(schema.shortlistCreators)
    .set({
      ...parsed.data,
      proposedPrice: parsed.data.proposedPrice?.toString(),
      finalPrice: parsed.data.finalPrice?.toString(),
      updatedAt: new Date(),
    })
    .where(eq(schema.shortlistCreators.id, params.entryId))
    .returning();

  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, { params }: { params: { entryId: string } }) {
  const db = getDb();
  await db.delete(schema.shortlistCreators).where(eq(schema.shortlistCreators.id, params.entryId));

  return NextResponse.json({ ok: true });
}
