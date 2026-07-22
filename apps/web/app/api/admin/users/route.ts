export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

const SAFE_COLUMNS = {
  id: schema.users.id,
  email: schema.users.email,
  fullName: schema.users.fullName,
  role: schema.users.role,
  status: schema.users.status,
  createdAt: schema.users.createdAt,
  lastLoginAt: schema.users.lastLoginAt,
};

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(or(ilike(schema.users.email, `%${q}%`), ilike(schema.users.fullName, `%${q}%`)));
  if (role) conditions.push(eq(schema.users.role, role));
  if (status) conditions.push(eq(schema.users.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Never select passwordHash — this endpoint previously returned it to the browser on every
  // admin users-page load (db.select() without a column list pulls every column).
  // count(*) over() rides along with the paginated rows instead of a second round trip.
  const rows = await db
    .select({ ...SAFE_COLUMNS, __total: sql<number>`count(*) over()` })
    .from(schema.users)
    .where(whereClause)
    .orderBy(desc(schema.users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = rows.length > 0 ? Number(rows[0].__total) : 0;
  const results = rows.map(({ __total, ...rest }) => rest);

  return NextResponse.json({ results, total, page, pageSize });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["suspend", "reactivate", "change_role"]),
  role: z.enum(["creator", "brand", "admin"]).optional(),
});

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  const { id, action, role } = parsed.data;

  const db = getDb();
  const [target] = await db.select(SAFE_COLUMNS).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if ((action === "suspend" || action === "change_role") && target.id === session.user.id) {
    return NextResponse.json({ error: "CANNOT_MODIFY_SELF", message: "You can't suspend or change the role of your own account." }, { status: 400 });
  }

  if ((action === "suspend" && target.role === "admin") || (action === "change_role" && target.role === "admin" && role !== "admin")) {
    const [{ count: adminCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "active")));
    if (Number(adminCount) <= 1) {
      return NextResponse.json({ error: "LAST_ADMIN", message: "This is the last active admin account — it can't be suspended or demoted." }, { status: 400 });
    }
  }

  let patch: Partial<typeof target> = {};
  if (action === "suspend") patch = { status: "suspended" };
  if (action === "reactivate") patch = { status: "active" };
  if (action === "change_role") {
    if (!role) return NextResponse.json({ error: "INVALID_INPUT", message: "role is required for change_role" }, { status: 400 });
    patch = { role };
  }

  await db.update(schema.users).set(patch).where(eq(schema.users.id, id));

  await recordAudit({
    actorUserId: session.user.id,
    action: `user.${action}`,
    entityType: "user",
    entityId: id,
    before: { role: target.role, status: target.status },
    after: { role: patch.role ?? target.role, status: patch.status ?? target.status },
    request,
  });

  return NextResponse.json({ success: true });
}
