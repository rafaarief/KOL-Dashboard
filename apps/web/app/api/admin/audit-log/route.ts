export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const entityType = url.searchParams.get("entityType");
  const actorEmail = url.searchParams.get("actor");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "40", 10));

  const db = getDb();
  const conditions = [];
  if (action) conditions.push(ilike(schema.adminAuditLog.action, `%${action}%`));
  if (entityType) conditions.push(eq(schema.adminAuditLog.entityType, entityType));
  if (actorEmail) conditions.push(ilike(schema.users.email, `%${actorEmail}%`));
  if (from) conditions.push(gte(schema.adminAuditLog.createdAt, new Date(from)));
  if (to) conditions.push(lte(schema.adminAuditLog.createdAt, new Date(to)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.adminAuditLog.id,
      action: schema.adminAuditLog.action,
      entityType: schema.adminAuditLog.entityType,
      entityId: schema.adminAuditLog.entityId,
      beforeState: schema.adminAuditLog.beforeState,
      afterState: schema.adminAuditLog.afterState,
      metadata: schema.adminAuditLog.metadata,
      createdAt: schema.adminAuditLog.createdAt,
      actorEmail: schema.users.email,
      __total: sql<number>`count(*) over()`,
    })
    .from(schema.adminAuditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.adminAuditLog.actorUserId))
    .where(whereClause)
    .orderBy(desc(schema.adminAuditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = rows.length > 0 ? Number(rows[0].__total) : 0;
  const results = rows.map(({ __total, ...rest }) => rest);

  return NextResponse.json({ results, total, page, pageSize });
}
