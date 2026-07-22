// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getDefaultUserId } from "@/lib/currentUser";
import { getCreatorRefreshQueue } from "@/lib/queue";

/** FR-020 — request a profile-data refresh for a single creator. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  // Previously enqueued unconditionally — a typo'd/stale id was silently accepted (the worker
  // just logs a warning and no-ops on an unknown creator), so the caller got an "ok" response
  // for a job that did nothing.
  const [creator] = await getDb().select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.id, params.id)).limit(1);
  if (!creator) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const userId = await getDefaultUserId();

  await getCreatorRefreshQueue().add(
    "CREATOR_REFRESH",
    { jobType: "CREATOR_REFRESH", creatorId: params.id, requestedBy: userId },
    { attempts: 1, removeOnComplete: 200, removeOnFail: 200 }
  );

  return NextResponse.json({ ok: true });
}
