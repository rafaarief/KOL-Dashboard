export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";
import { csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const availability = url.searchParams.get("availability");
  const verification = url.searchParams.get("verification");
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) {
    conditions.push(
      or(ilike(schema.creatorProfiles.displayName, `%${q}%`), ilike(schema.creatorProfiles.username, `%${q}%`))
    );
  }
  if (availability) conditions.push(eq(schema.creatorProfiles.availabilityStatus, availability));
  if (verification) conditions.push(eq(schema.creatorProfiles.verificationStatus, verification));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.creatorProfiles.id,
      username: schema.creatorProfiles.username,
      displayName: schema.creatorProfiles.displayName,
      avatarUrl: schema.creatorProfiles.avatarUrl,
      city: schema.creatorProfiles.city,
      email: schema.users.email,
      availabilityStatus: schema.creatorProfiles.availabilityStatus,
      verificationStatus: schema.creatorProfiles.verificationStatus,
      status: schema.creatorProfiles.status,
      featured: schema.creatorProfiles.featured,
      createdAt: schema.creatorProfiles.createdAt,
      primaryNicheId: schema.creatorProfiles.primaryNicheId,
    })
    .from(schema.creatorProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
    .where(whereClause)
    .orderBy(desc(schema.creatorProfiles.createdAt))
    .limit(pageSize)
    .offset(isCsv ? 0 : (page - 1) * pageSize);

  if (isCsv) return csvResponse(rows, "creators.csv");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.creatorProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
    .where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

const ACTIONS = {
  verify: { verificationStatus: "verified" },
  reject_verification: { verificationStatus: "rejected" },
  suspend: { status: "suspended" },
  reactivate: { status: "active" },
  feature: { featured: true },
  unfeature: { featured: false },
} as const;

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const action = body?.action as keyof typeof ACTIONS | undefined;
  if (!id || !action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const db = getDb();
  const [before] = await db
    .select({ status: schema.creatorProfiles.status, verificationStatus: schema.creatorProfiles.verificationStatus, featured: schema.creatorProfiles.featured })
    .from(schema.creatorProfiles)
    .where(eq(schema.creatorProfiles.id, id))
    .limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db
    .update(schema.creatorProfiles)
    .set({ ...ACTIONS[action], updatedAt: new Date() })
    .where(eq(schema.creatorProfiles.id, id));

  await recordAudit({ actorUserId: session.user.id, action: `creator.${action}`, entityType: "creator", entityId: id, before, after: ACTIONS[action], request });

  return NextResponse.json({ success: true });
}
