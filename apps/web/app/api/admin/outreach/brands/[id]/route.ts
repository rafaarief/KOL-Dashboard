export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { BRAND_OUTREACH_STATUSES, OUTREACH_SOURCES } from "@/lib/outreachEnums";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [outreach] = await db
    .select({
      id: schema.brandOutreach.id,
      picUserId: schema.brandOutreach.picUserId,
      picName: schema.users.fullName,
      brandName: schema.brandOutreach.brandName,
      industry: schema.brandOutreach.industry,
      email: schema.brandOutreach.email,
      phone: schema.brandOutreach.phone,
      instagramUrl: schema.brandOutreach.instagramUrl,
      instagramFollowers: schema.brandOutreach.instagramFollowers,
      tiktokUrl: schema.brandOutreach.tiktokUrl,
      tiktokFollowers: schema.brandOutreach.tiktokFollowers,
      website: schema.brandOutreach.website,
      source: schema.brandOutreach.source,
      status: schema.brandOutreach.status,
      notes: schema.brandOutreach.notes,
      lastFollowUpAt: schema.brandOutreach.lastFollowUpAt,
      statusChangedAt: schema.brandOutreach.statusChangedAt,
      convertedBrandProfileId: schema.brandOutreach.convertedBrandProfileId,
      createdAt: schema.brandOutreach.createdAt,
    })
    .from(schema.brandOutreach)
    .innerJoin(schema.users, eq(schema.users.id, schema.brandOutreach.picUserId))
    .where(eq(schema.brandOutreach.id, params.id))
    .limit(1);

  if (!outreach) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const events = await db
    .select({
      id: schema.brandOutreachEvents.id,
      eventType: schema.brandOutreachEvents.eventType,
      fromStatus: schema.brandOutreachEvents.fromStatus,
      toStatus: schema.brandOutreachEvents.toStatus,
      note: schema.brandOutreachEvents.note,
      createdByName: schema.users.fullName,
      createdAt: schema.brandOutreachEvents.createdAt,
    })
    .from(schema.brandOutreachEvents)
    .leftJoin(schema.users, eq(schema.users.id, schema.brandOutreachEvents.createdByUserId))
    .where(eq(schema.brandOutreachEvents.brandOutreachId, params.id))
    .orderBy(desc(schema.brandOutreachEvents.createdAt));

  return NextResponse.json({ outreach, events });
}

const patchSchema = z.object({
  brandName: z.string().min(1).max(160).optional(),
  industry: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.number().int().nonnegative().optional(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.number().int().nonnegative().optional(),
  website: z.string().max(300).optional().or(z.literal("")),
  source: z.enum(OUTREACH_SOURCES).optional(),
  status: z.enum(BRAND_OUTREACH_STATUSES).optional(),
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
  const [before] = await db.select().from(schema.brandOutreach).where(eq(schema.brandOutreach.id, params.id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const now = new Date();
  const updates: Record<string, unknown> = { ...rest, updatedAt: now };
  if (notes !== undefined) updates.notes = notes || null;
  if (status && status !== before.status) {
    updates.status = status;
    updates.statusChangedAt = now;
  }
  if (logFollowUp) updates.lastFollowUpAt = now;

  await db.update(schema.brandOutreach).set(updates).where(eq(schema.brandOutreach.id, params.id));

  if (status && status !== before.status) {
    await db.insert(schema.brandOutreachEvents).values({
      brandOutreachId: params.id,
      eventType: "status_changed",
      fromStatus: before.status,
      toStatus: status,
      createdByUserId: session.user.id,
    });
  }
  if (logFollowUp) {
    await db.insert(schema.brandOutreachEvents).values({
      brandOutreachId: params.id,
      eventType: "follow_up",
      note: notes || null,
      createdByUserId: session.user.id,
    });
  } else if (notes !== undefined && notes !== before.notes) {
    await db.insert(schema.brandOutreachEvents).values({
      brandOutreachId: params.id,
      eventType: "note",
      note: notes || null,
      createdByUserId: session.user.id,
    });
  }

  return NextResponse.json({ success: true });
}
