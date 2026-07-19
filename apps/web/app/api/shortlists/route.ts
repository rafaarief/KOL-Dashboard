// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { getDefaultUserId } from "@/lib/currentUser";

const createShortlistSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().nullable().optional(),
  campaignName: z.string().nullable().optional(),
  campaignBrief: z.string().nullable().optional(),
});

export async function GET() {
  const db = getDb();
  const shortlists = await db.select().from(schema.shortlists).orderBy(desc(schema.shortlists.createdAt));

  return NextResponse.json({ shortlists });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createShortlistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const userId = await getDefaultUserId();
  const db = getDb();

  const [shortlist] = await db
    .insert(schema.shortlists)
    .values({
      name: parsed.data.name,
      clientName: parsed.data.clientName ?? null,
      campaignName: parsed.data.campaignName ?? null,
      campaignBrief: parsed.data.campaignBrief ?? null,
      createdBy: userId,
    })
    .returning();

  return NextResponse.json({ shortlist }, { status: 201 });
}
