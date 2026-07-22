export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

/** Read-only categories lookup for the Brand Outreach industry picker. Deliberately separate
 * from /api/admin/categories (admin-only, also handles taxonomy management) since outreach_admin
 * may read this list but must never create/manage taxonomy. */
export async function GET() {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const categories = await db
    .select({ id: schema.marketplaceCategories.id, name: schema.marketplaceCategories.name })
    .from(schema.marketplaceCategories)
    .orderBy(asc(schema.marketplaceCategories.name));
  return NextResponse.json({ categories });
}
