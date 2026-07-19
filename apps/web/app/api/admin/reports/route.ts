export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).limit(100);
  return NextResponse.json({ results: rows });
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as "resolved" | "dismissed" | undefined;
  if (!id || !status) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  await db.update(schema.reports).set({ status }).where(eq(schema.reports.id, id));
  return NextResponse.json({ success: true });
}
