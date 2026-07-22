export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

const OPEN_STATUSES = ["pending", "needs_information"] as const;

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  // Previously a hard .limit(100) with no page param — see reports/route.ts for the identical fix.
  const requestRows = await db
    .select({
      id: schema.verificationRequests.id,
      subjectType: schema.verificationRequests.subjectType,
      subjectId: schema.verificationRequests.subjectId,
      status: schema.verificationRequests.status,
      reviewerNote: schema.verificationRequests.reviewerNote,
      reviewerId: schema.verificationRequests.reviewerId,
      createdAt: schema.verificationRequests.createdAt,
      reviewedAt: schema.verificationRequests.reviewedAt,
      __total: sql<number>`count(*) over()`,
    })
    .from(schema.verificationRequests)
    .orderBy(desc(schema.verificationRequests.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = requestRows.length > 0 ? Number(requestRows[0].__total) : 0;
  const requests = requestRows.map(({ __total, ...rest }) => rest);

  // Two batched lookups instead of one query per row (up to 100 separate round trips before).
  const creatorIds = requests.filter((r) => r.subjectType === "creator").map((r) => r.subjectId);
  const brandIds = requests.filter((r) => r.subjectType === "brand").map((r) => r.subjectId);

  const [creators, brands] = await Promise.all([
    creatorIds.length > 0
      ? db
          .select({ id: schema.creatorProfiles.id, name: schema.creatorProfiles.displayName, username: schema.creatorProfiles.username })
          .from(schema.creatorProfiles)
          .where(inArray(schema.creatorProfiles.id, creatorIds))
      : Promise.resolve([]),
    brandIds.length > 0 ? db.select({ id: schema.brandProfiles.id, name: schema.brandProfiles.brandName }).from(schema.brandProfiles).where(inArray(schema.brandProfiles.id, brandIds)) : Promise.resolve([]),
  ]);
  const creatorById = new Map(creators.map((c) => [c.id, c]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const enriched = requests.map((req) => {
    if (req.subjectType === "creator") {
      const creator = creatorById.get(req.subjectId);
      return { ...req, subjectLabel: creator ? `${creator.name} (@${creator.username})` : "Unknown creator" };
    }
    const brand = brandById.get(req.subjectId);
    return { ...req, subjectLabel: brand ? brand.name : "Unknown brand" };
  });

  return NextResponse.json({ results: enriched, total, page, pageSize });
}

const DECISIONS = ["approved", "rejected", "needs_information", "revoked"] as const;

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const decision = body?.decision as (typeof DECISIONS)[number] | undefined;
  const reviewerNote = typeof body?.reviewerNote === "string" ? body.reviewerNote : undefined;
  if (!id || !decision || !DECISIONS.includes(decision)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  const [reqRow] = await db.select().from(schema.verificationRequests).where(eq(schema.verificationRequests.id, id)).limit(1);
  if (!reqRow) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Conditional update: only applies while the request is still open, so two admins racing to
  // resolve the same request (or a double-click) can't both "win" and silently overwrite each
  // other's decision — the second one gets a clean 409 instead.
  const [updated] = await db
    .update(schema.verificationRequests)
    .set({ status: decision, reviewerNote, reviewerId: session.user.id, reviewedAt: new Date() })
    .where(and(eq(schema.verificationRequests.id, id), inArray(schema.verificationRequests.status, [...OPEN_STATUSES])))
    .returning({ id: schema.verificationRequests.id });
  if (!updated) return NextResponse.json({ error: "ALREADY_DECIDED" }, { status: 409 });

  // needs_information doesn't change the subject's public verification badge yet — it's a
  // request for more docs, not a final decision.
  if (decision === "approved" || decision === "rejected" || decision === "revoked") {
    const newVerificationStatus = decision === "approved" ? "verified" : "rejected";
    if (reqRow.subjectType === "creator") {
      await db.update(schema.creatorProfiles).set({ verificationStatus: newVerificationStatus }).where(eq(schema.creatorProfiles.id, reqRow.subjectId));
    } else {
      await db.update(schema.brandProfiles).set({ verificationStatus: newVerificationStatus }).where(eq(schema.brandProfiles.id, reqRow.subjectId));
    }
  }

  await recordAudit({
    actorUserId: session.user.id,
    action: `verification.${decision}`,
    entityType: reqRow.subjectType,
    entityId: reqRow.subjectId,
    before: { status: reqRow.status },
    after: { status: decision },
    metadata: reviewerNote ? { reviewerNote } : undefined,
    request,
  });

  return NextResponse.json({ success: true });
}
