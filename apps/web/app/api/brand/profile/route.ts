export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [profile] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.userId, session.user.id)).limit(1);
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ profile });
}

const patchSchema = z.object({
  brandName: z.string().min(1).optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactVisible: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await requireRole(["brand"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.brandProfiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.brandProfiles.userId, session.user.id));

  return NextResponse.json({ success: true });
}
