export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(100, Number.parseInt(url.searchParams.get("pageSize") ?? "30", 10));

  const db = getDb();
  const conditions = [];
  if (status) conditions.push(eq(schema.campaignApplications.status, status));
  if (campaignId) conditions.push(eq(schema.campaignApplications.campaignId, campaignId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: schema.campaignApplications.id,
      status: schema.campaignApplications.status,
      proposedRate: schema.campaignApplications.proposedRate,
      createdAt: schema.campaignApplications.createdAt,
      updatedAt: schema.campaignApplications.updatedAt,
      campaignTitle: schema.campaigns.title,
      campaignSlug: schema.campaigns.slug,
      brandName: schema.brandProfiles.brandName,
      creatorUsername: schema.creatorProfiles.username,
      creatorDisplayName: schema.creatorProfiles.displayName,
    })
    .from(schema.campaignApplications)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.campaignApplications.campaignId))
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .innerJoin(schema.creatorProfiles, eq(schema.creatorProfiles.id, schema.campaignApplications.creatorProfileId))
    .where(whereClause)
    .orderBy(desc(schema.campaignApplications.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.campaignApplications).where(whereClause);

  return NextResponse.json({ results: rows, total: Number(count), page, pageSize });
}
