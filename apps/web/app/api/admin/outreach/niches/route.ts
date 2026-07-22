export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

/** Read-only niches lookup for the onboarding wizards' niche picker. Deliberately separate from
 * /api/admin/categories (admin-only, also handles taxonomy management) since outreach_admin may
 * read this list but must never create/manage taxonomy. */
export async function GET() {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const niches = await db.select({ id: schema.niches.id, name: schema.niches.name }).from(schema.niches).orderBy(asc(schema.niches.name));
  return NextResponse.json({ niches });
}
