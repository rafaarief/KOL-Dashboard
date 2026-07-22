export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { KOL_OUTREACH_STATUSES, OUTREACH_SOURCES } from "@/lib/outreachEnums";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [outreach] = await db
    .select({
      id: schema.kolOutreach.id,
      picUserId: schema.kolOutreach.picUserId,
      picName: schema.users.fullName,
      kolName: schema.kolOutreach.kolName,
      email: schema.kolOutreach.email,
      phone: schema.kolOutreach.phone,
      instagramUrl: schema.kolOutreach.instagramUrl,
      instagramFollowers: schema.kolOutreach.instagramFollowers,
      tiktokUrl: schema.kolOutreach.tiktokUrl,
      tiktokFollowers: schema.kolOutreach.tiktokFollowers,
      primaryNicheId: schema.kolOutreach.primaryNicheId,
      city: schema.kolOutreach.city,
      source: schema.kolOutreach.source,
      status: schema.kolOutreach.status,
      notes: schema.kolOutreach.notes,
      lastFollowUpAt: schema.kolOutreach.lastFollowUpAt,
      statusChangedAt: schema.kolOutreach.statusChangedAt,
      convertedCreatorProfileId: schema.kolOutreach.convertedCreatorProfileId,
      createdAt: schema.kolOutreach.createdAt,
    })
    .from(schema.kolOutreach)
    .innerJoin(schema.users, eq(schema.users.id, schema.kolOutreach.picUserId))
    .where(eq(schema.kolOutreach.id, params.id))
    .limit(1);

  if (!outreach) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const events = await db
    .select({
      id: schema.kolOutreachEvents.id,
      eventType: schema.kolOutreachEvents.eventType,
      fromStatus: schema.kolOutreachEvents.fromStatus,
      toStatus: schema.kolOutreachEvents.toStatus,
      note: schema.kolOutreachEvents.note,
      createdByName: schema.users.fullName,
      createdAt: schema.kolOutreachEvents.createdAt,
    })
    .from(schema.kolOutreachEvents)
    .leftJoin(schema.users, eq(schema.users.id, schema.kolOutreachEvents.createdByUserId))
    .where(eq(schema.kolOutreachEvents.kolOutreachId, params.id))
    .orderBy(desc(schema.kolOutreachEvents.createdAt));

  return NextResponse.json({ outreach, events });
}

const patchSchema = z.object({
  kolName: z.string().min(1).max(160).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.number().int().nonnegative().optional(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.number().int().nonnegative().optional(),
  city: z.string().max(120).optional().or(z.literal("")),
  source: z.enum(OUTREACH_SOURCES).optional(),
  status: z.enum(KOL_OUTREACH_STATUSES).optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
  logFollowUp: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const { logFollowUp, notes, status, ...rest } = parsed.data;

  const db = getDb();
  const [before] = await db.select().from(schema.kolOutreach).where(eq(schema.kolOutreach.id, params.id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const now = new Date();
  const updates: Record<string, unknown> = { ...rest, updatedAt: now };
  if (notes !== undefined) updates.notes = notes || null;
  if (status && status !== before.status) {
    updates.status = status;
    updates.statusChangedAt = now;
  }
  if (logFollowUp) updates.lastFollowUpAt = now;

  await db.update(schema.kolOutreach).set(updates).where(eq(schema.kolOutreach.id, params.id));

  if (status && status !== before.status) {
    await db.insert(schema.kolOutreachEvents).values({
      kolOutreachId: params.id,
      eventType: "status_changed",
      fromStatus: before.status,
      toStatus: status,
      createdByUserId: session.user.id,
    });
  }
  if (logFollowUp) {
    await db.insert(schema.kolOutreachEvents).values({
      kolOutreachId: params.id,
      eventType: "follow_up",
      note: notes || null,
      createdByUserId: session.user.id,
    });
  } else if (notes !== undefined && notes !== before.notes) {
    await db.insert(schema.kolOutreachEvents).values({
      kolOutreachId: params.id,
      eventType: "note",
      note: notes || null,
      createdByUserId: session.user.id,
    });
  }

  return NextResponse.json({ success: true });
}
