export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  // Previously a hard .limit(100) with no page param at all — once there were more than 100
  // open reports, the oldest ones became permanently invisible with no indication anything was
  // truncated. count(*) over() rides along instead of a second query.
  const rows = await db
    .select({
      id: schema.reports.id,
      reporterUserId: schema.reports.reporterUserId,
      targetType: schema.reports.targetType,
      targetId: schema.reports.targetId,
      reason: schema.reports.reason,
      status: schema.reports.status,
      resolverId: schema.reports.resolverId,
      resolutionReason: schema.reports.resolutionReason,
      createdAt: schema.reports.createdAt,
      resolvedAt: schema.reports.resolvedAt,
      __total: sql<number>`count(*) over()`,
    })
    .from(schema.reports)
    .orderBy(desc(schema.reports.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = rows.length > 0 ? Number(rows[0].__total) : 0;
  const results = rows.map(({ __total, ...rest }) => rest);

  return NextResponse.json({ results, total, page, pageSize });
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
  // Conditional update: only applies while the report isn't already resolved/dismissed, so two
  // admins racing to close the same report (or a double-click) can't silently overwrite each
  // other's decision — the second one gets a clean 409 instead.
  const [updated] = await db
    .update(schema.reports)
    .set({
      status,
      resolutionReason,
      resolverId: isTerminal ? session.user.id : undefined,
      resolvedAt: isTerminal ? new Date() : undefined,
    })
    .where(and(eq(schema.reports.id, id), notInArray(schema.reports.status, ["resolved", "dismissed"])))
    .returning({ id: schema.reports.id });
  if (!updated) return NextResponse.json({ error: "ALREADY_RESOLVED" }, { status: 409 });

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
