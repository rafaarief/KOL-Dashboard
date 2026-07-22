export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";
import { csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const verification = url.searchParams.get("verification");
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(or(ilike(schema.brandProfiles.brandName, `%${q}%`), ilike(schema.brandProfiles.industry, `%${q}%`)));
  if (verification) conditions.push(eq(schema.brandProfiles.verificationStatus, verification));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const BASE_COLUMNS = {
    id: schema.brandProfiles.id,
    slug: schema.brandProfiles.slug,
    brandName: schema.brandProfiles.brandName,
    logoUrl: schema.brandProfiles.logoUrl,
    industry: schema.brandProfiles.industry,
    city: schema.brandProfiles.city,
    email: schema.users.email,
    verificationStatus: schema.brandProfiles.verificationStatus,
    status: schema.brandProfiles.status,
    featured: schema.brandProfiles.featured,
    createdAt: schema.brandProfiles.createdAt,
    activeCampaigns: sql<number>`(select count(*) from campaigns c where c.brand_profile_id = brand_profiles.id and c.status = 'published')`,
  };

  if (isCsv) {
    const rows = await db
      .select(BASE_COLUMNS)
      .from(schema.brandProfiles)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
      .where(whereClause)
      .orderBy(desc(schema.brandProfiles.createdAt))
      .limit(pageSize);
    return csvResponse(rows, "brands.csv");
  }

  // count(*) over() rides along with the paginated rows in one query instead of a second
  // round trip re-running the same where/joins just to get the total.
  const rows = await db
    .select({ ...BASE_COLUMNS, __total: sql<number>`count(*) over()` })
    .from(schema.brandProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
    .where(whereClause)
    .orderBy(desc(schema.brandProfiles.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = rows.length > 0 ? Number(rows[0].__total) : 0;
  const results = rows.map(({ __total, ...rest }) => rest);

  return NextResponse.json({ results, total, page, pageSize });
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
    .select({ status: schema.brandProfiles.status, verificationStatus: schema.brandProfiles.verificationStatus, featured: schema.brandProfiles.featured })
    .from(schema.brandProfiles)
    .where(eq(schema.brandProfiles.id, id))
    .limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db
    .update(schema.brandProfiles)
    .set({ ...ACTIONS[action], updatedAt: new Date() })
    .where(eq(schema.brandProfiles.id, id));

  await recordAudit({ actorUserId: session.user.id, action: `brand.${action}`, entityType: "brand", entityId: id, before, after: ACTIONS[action], request });

  return NextResponse.json({ success: true });
}
