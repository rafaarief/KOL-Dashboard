// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** FR — cancel an in-flight search (PRD section 20.4). The worker checks this status
 * between steps and stops picking up further keywords/profiles once cancelled. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  // Conditional on still being in-flight — without this, a stale tab or double-click cancel
  // after the search already completed/failed silently flipped it back to "cancelled",
  // corrupting history/dashboard counts retroactively.
  const [updated] = await db
    .update(schema.searches)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(and(eq(schema.searches.id, params.id), inArray(schema.searches.status, ["queued", "running"])))
    .returning({ id: schema.searches.id });

  if (!updated) return NextResponse.json({ error: "NOT_CANCELLABLE" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
