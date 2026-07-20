export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).limit(100);
  return NextResponse.json({ results: rows });
}

const STATUSES = ["under_review", "resolved", "dismissed"] as const;

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as (typeof STATUSES)[number] | undefined;
  const resolutionReason = typeof body?.resolutionReason === "string" ? body.resolutionReason : undefined;
  if (!id || !status || !STATUSES.includes(status)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  const [before] = await db.select({ status: schema.reports.status }).from(schema.reports).where(eq(schema.reports.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isTerminal = status === "resolved" || status === "dismissed";
  await db
    .update(schema.reports)
    .set({
      status,
      resolutionReason,
      resolverId: isTerminal ? session.user.id : undefined,
      resolvedAt: isTerminal ? new Date() : undefined,
    })
    .where(eq(schema.reports.id, id));

  await recordAudit({
    actorUserId: session.user.id,
    action: `report.${status}`,
    entityType: "report",
    entityId: id,
    before,
    after: { status },
    metadata: resolutionReason ? { resolutionReason } : undefined,
    request,
  });

  return NextResponse.json({ success: true });
}
