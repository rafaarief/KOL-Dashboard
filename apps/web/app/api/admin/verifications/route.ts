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
  const requests = await db
    .select()
    .from(schema.verificationRequests)
    .orderBy(desc(schema.verificationRequests.createdAt))
    .limit(100);

  const enriched = await Promise.all(
    requests.map(async (req) => {
      if (req.subjectType === "creator") {
        const [creator] = await db
          .select({ name: schema.creatorProfiles.displayName, username: schema.creatorProfiles.username })
          .from(schema.creatorProfiles)
          .where(eq(schema.creatorProfiles.id, req.subjectId))
          .limit(1);
        return { ...req, subjectLabel: creator ? `${creator.name} (@${creator.username})` : "Unknown creator" };
      }
      const [brand] = await db
        .select({ name: schema.brandProfiles.brandName })
        .from(schema.brandProfiles)
        .where(eq(schema.brandProfiles.id, req.subjectId))
        .limit(1);
      return { ...req, subjectLabel: brand ? brand.name : "Unknown brand" };
    })
  );

  return NextResponse.json({ results: enriched });
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

  await db
    .update(schema.verificationRequests)
    .set({ status: decision, reviewerNote, reviewerId: session.user.id, reviewedAt: new Date() })
    .where(eq(schema.verificationRequests.id, id));

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
