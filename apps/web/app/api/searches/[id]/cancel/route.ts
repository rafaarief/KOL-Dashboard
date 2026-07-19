import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

/** FR — cancel an in-flight search (PRD section 20.4). The worker checks this status
 * between steps and stops picking up further keywords/profiles once cancelled. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const db = getDb();
  await db
    .update(schema.searches)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(eq(schema.searches.id, params.id));

  return NextResponse.json({ ok: true });
}
