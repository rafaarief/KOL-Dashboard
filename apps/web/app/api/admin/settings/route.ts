export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const flags = await db.select().from(schema.featureFlags).orderBy(asc(schema.featureFlags.key));
  return NextResponse.json({ flags });
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const key = body?.key as string | undefined;
  const enabled = body?.enabled as boolean | undefined;
  if (!key || typeof enabled !== "boolean") return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const db = getDb();
  const [before] = await db.select({ enabled: schema.featureFlags.enabled }).from(schema.featureFlags).where(eq(schema.featureFlags.key, key)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db.update(schema.featureFlags).set({ enabled, updatedAt: new Date() }).where(eq(schema.featureFlags.key, key));

  await recordAudit({
    actorUserId: session.user.id,
    action: "settings.toggle_feature_flag",
    entityType: "featureFlag",
    entityId: key,
    before,
    after: { enabled },
    request,
  });

  return NextResponse.json({ success: true });
}
