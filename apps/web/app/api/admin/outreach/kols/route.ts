export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { csvResponse } from "@/lib/csv";
import { findKolDuplicates } from "@/lib/outreachDuplicateCheck";
import { KOL_OUTREACH_STATUSES, OUTREACH_SOURCES } from "@/lib/outreachEnums";

export async function GET(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const mine = url.searchParams.get("mine") === "true";
  const sort = url.searchParams.get("sort") === "followers" ? "followers" : "newest";
  const isCsv = url.searchParams.get("format") === "csv";
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = isCsv ? 5000 : Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(schema.kolOutreach.kolName, `%${q}%`),
        ilike(schema.kolOutreach.email, `%${q}%`),
        ilike(schema.kolOutreach.phone, `%${q}%`),
        ilike(schema.kolOutreach.instagramUrl, `%${q}%`),
        ilike(schema.kolOutreach.tiktokUrl, `%${q}%`),
        ilike(schema.kolOutreach.city, `%${q}%`)
      )
    );
  }
  if (status) conditions.push(eq(schema.kolOutreach.status, status));
  if (source) conditions.push(eq(schema.kolOutreach.source, source));
  if (mine) conditions.push(eq(schema.kolOutreach.picUserId, session.user.id));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const followerScore = sql<number>`greatest(coalesce(${schema.kolOutreach.instagramFollowers}, 0), coalesce(${schema.kolOutreach.tiktokFollowers}, 0))`;

  const rows = await db
    .select({
      id: schema.kolOutreach.id,
      picUserId: schema.kolOutreach.picUserId,
      picName: schema.users.fullName,
      kolName: schema.kolOutreach.kolName,
      email: schema.kolOutreach.email,
      phone: schema.kolOutreach.phone,
      instagramUrl: schema.kolOutreach.instagramUrl,
      instagramFollowers: schema.kolOutreach.instagramFollowers,
      tiktokUrl: schema.kolOutreach.tiktokUrl,
      tiktokFollowers: schema.kolOutreach.tiktokFollowers,
      city: schema.kolOutreach.city,
      source: schema.kolOutreach.source,
      status: schema.kolOutreach.status,
      notes: schema.kolOutreach.notes,
      lastFollowUpAt: schema.kolOutreach.lastFollowUpAt,
      createdAt: schema.kolOutreach.createdAt,
    })
    .from(schema.kolOutreach)
    .innerJoin(schema.users, eq(schema.users.id, schema.kolOutreach.picUserId))
    .where(whereClause)
    .orderBy(sort === "followers" ? desc(followerScore) : desc(schema.kolOutreach.createdAt))
    .limit(pageSize)
    .offset(isCsv ? 0 : (page - 1) * pageSize);

  if (isCsv) return csvResponse(rows, "kol-outreach.csv");

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.kolOutreach).where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}

const createSchema = z.object({
  kolName: z.string().min(1).max(160),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.number().int().nonnegative().optional(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.number().int().nonnegative().optional(),
  primaryNicheId: z.string().uuid().optional(),
  city: z.string().max(120).optional().or(z.literal("")),
  source: z.enum(OUTREACH_SOURCES).default("other"),
  status: z.enum(KOL_OUTREACH_STATUSES).default("new"),
  notes: z.string().max(4000).optional().or(z.literal("")),
  confirmDuplicate: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });

  const { confirmDuplicate, ...data } = parsed.data;

  if (!confirmDuplicate) {
    const matches = await findKolDuplicates({ email: data.email, phone: data.phone, instagramUrl: data.instagramUrl, tiktokUrl: data.tiktokUrl });
    if (matches.length > 0) {
      return NextResponse.json({ error: "POSSIBLE_DUPLICATE", matches }, { status: 409 });
    }
  }

  const db = getDb();
  const now = new Date();
  const [created] = await db
    .insert(schema.kolOutreach)
    .values({
      picUserId: session.user.id,
      kolName: data.kolName,
      email: data.email || null,
      phone: data.phone || null,
      instagramUrl: data.instagramUrl || null,
      instagramFollowers: data.instagramFollowers ?? null,
      tiktokUrl: data.tiktokUrl || null,
      tiktokFollowers: data.tiktokFollowers ?? null,
      primaryNicheId: data.primaryNicheId ?? null,
      city: data.city || null,
      source: data.source,
      status: data.status,
      notes: data.notes || null,
      statusChangedAt: now,
    })
    .returning({ id: schema.kolOutreach.id });

  await db.insert(schema.kolOutreachEvents).values({
    kolOutreachId: created.id,
    eventType: "created",
    toStatus: data.status,
    createdByUserId: session.user.id,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
