import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const [search] = await db.select().from(schema.searches).where(eq(schema.searches.id, params.id)).limit(1);

  if (!search) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ search });
}
