import { getDb, schema } from "@/lib/db";

interface RecordAuditInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  request?: Request;
}

function extractIp(request?: Request): string | null {
  if (!request) return null;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
}

/** Fire-and-forget by design: an audit-log write failing must never block or roll back the
 * admin action it's describing. Never pass passwordHash/tokens/secrets in before/after/metadata. */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  const db = getDb();
  try {
    await db.insert(schema.adminAuditLog).values({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeState: input.before ?? null,
      afterState: input.after ?? null,
      metadata: input.metadata ?? {},
      ipAddress: extractIp(input.request),
    });
  } catch (error) {
    console.error("audit log write failed", { action: input.action, entityType: input.entityType, error });
  }
}
