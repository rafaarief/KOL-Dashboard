export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { csvResponse } from "@/lib/csv";
import { findBrandDuplicates } from "@/lib/outreachDuplicateCheck";
import { BRAND_OUTREACH_STATUSES, OUTREACH_SOURCES } from "@/lib/outreachEnums";
import { brandKpis } from "@/lib/outreachMetrics";

// Must stay textually identical to the expression indexed by brand_outreach_search_trgm_idx
// (see packages/database/migrations/0010_*.sql) — otherwise Postgres can't use that index for
// this ILIKE and every search falls back to a full sequential scan.
const BRAND_SEARCH_BLOB = sql`(coalesce(${schema.brandOutreach.brandName}, '') || ' ' || coalesce(${schema.brandOutreach.email}, '') || ' ' || coalesce(${schema.brandOutreach.phone}, '') || ' ' || coalesce(${schema.brandOutreach.instagramUrl}, '') || ' ' || coalesce(${schema.brandOutreach.tiktokUrl}, '') || ' ' || coalesce(${schema.brandOutreach.website}, ''))`;

const BASE_COLUMNS = {
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
  createdAt: schema.brandOutreach.createdAt,
};

export async function GET(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const mine = url.searchParams.get("mine") === "true";
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) conditions.push(sql`${BRAND_SEARCH_BLOB} ilike ${`%${q}%`}`);
  if (status) conditions.push(eq(schema.brandOutreach.status, status));
  if (source) conditions.push(eq(schema.brandOutreach.source, source));
  if (mine) conditions.push(eq(schema.brandOutreach.picUserId, session.user.id));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  if (isCsv) {
    const rows = await db
      .select(BASE_COLUMNS)
      .from(schema.brandOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandOutreach.picUserId))
      .where(whereClause)
      .orderBy(desc(schema.brandOutreach.createdAt))
      .limit(pageSize);
    return csvResponse(rows, "brand-outreach.csv");
  }

  const [rows, kpis] = await Promise.all([
    db
      .select({ ...BASE_COLUMNS, __total: sql<number>`count(*) over()` })
      .from(schema.brandOutreach)
      .innerJoin(schema.users, eq(schema.users.id, schema.brandOutreach.picUserId))
      .where(whereClause)
      .orderBy(desc(schema.brandOutreach.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    brandKpis(),
  ]);

  const total = rows.length > 0 ? Number(rows[0].__total) : 0;
  const results = rows.map(({ __total, ...rest }) => rest);

  return NextResponse.json({ results, total, page, pageSize, kpis });
}

const createSchema = z.object({
  brandName: z.string().min(1).max(160),
  industry: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.number().int().nonnegative().optional(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.number().int().nonnegative().optional(),
  website: z.string().max(300).optional().or(z.literal("")),
  source: z.enum(OUTREACH_SOURCES).default("other"),
  status: z.enum(BRAND_OUTREACH_STATUSES).default("new"),
  notes: z.string().max(4000).optional().or(z.literal("")),
  confirmDuplicate: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const { confirmDuplicate, ...data } = parsed.data;
  const email = data.email ? data.email.toLowerCase().trim() : "";

  if (!confirmDuplicate) {
    const matches = await findBrandDuplicates({ email, phone: data.phone, instagramUrl: data.instagramUrl, tiktokUrl: data.tiktokUrl });
    if (matches.length > 0) {
      return NextResponse.json({ error: "POSSIBLE_DUPLICATE", matches }, { status: 409 });
    }
  }

  const db = getDb();
  const now = new Date();
  const [created] = await db
    .insert(schema.brandOutreach)
    .values({
      picUserId: session.user.id,
      brandName: data.brandName,
      industry: data.industry || null,
      email: email || null,
      phone: data.phone || null,
      instagramUrl: data.instagramUrl || null,
      instagramFollowers: data.instagramFollowers ?? null,
      tiktokUrl: data.tiktokUrl || null,
      tiktokFollowers: data.tiktokFollowers ?? null,
      website: data.website || null,
      source: data.source,
      status: data.status,
      notes: data.notes || null,
      statusChangedAt: now,
    })
    .returning({ id: schema.brandOutreach.id });

  await db.insert(schema.brandOutreachEvents).values({
    brandOutreachId: created.id,
    eventType: "created",
    toStatus: data.status,
    createdByUserId: session.user.id,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
