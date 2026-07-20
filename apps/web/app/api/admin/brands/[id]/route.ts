export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { recordAudit } from "@/lib/auditLog";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getDb();
  const [profile] = await db
    .select({
      id: schema.brandProfiles.id,
      userId: schema.brandProfiles.userId,
      slug: schema.brandProfiles.slug,
      brandName: schema.brandProfiles.brandName,
      industry: schema.brandProfiles.industry,
      city: schema.brandProfiles.city,
      description: schema.brandProfiles.description,
      website: schema.brandProfiles.website,
      email: schema.users.email,
      userStatus: schema.users.status,
      contactEmail: schema.brandProfiles.contactEmail,
      verificationStatus: schema.brandProfiles.verificationStatus,
      status: schema.brandProfiles.status,
      featured: schema.brandProfiles.featured,
      createdAt: schema.brandProfiles.createdAt,
    })
    .from(schema.brandProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.brandProfiles.userId))
    .where(eq(schema.brandProfiles.id, params.id))
    .limit(1);

  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [campaigns, reports, stats] = await Promise.all([
    db
      .select({
        id: schema.campaigns.id,
        title: schema.campaigns.title,
        status: schema.campaigns.status,
        creatorCountAccepted: schema.campaigns.creatorCountAccepted,
        creatorCountNeeded: schema.campaigns.creatorCountNeeded,
        createdAt: schema.campaigns.createdAt,
      })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.brandProfileId, profile.id)),
    db.select().from(schema.reports).where(eq(schema.reports.targetType, "brand")),
    db.execute(
      sql`select
            count(distinct ca.id)::int as "totalApplicants",
            count(distinct ca.id) filter (where ca.status = 'accepted')::int as "creatorsHired"
          from campaign_applications ca
          inner join campaigns c on c.id = ca.campaign_id
          where c.brand_profile_id = ${profile.id}`
    ),
  ]);

  return NextResponse.json({
    profile,
    campaigns,
    reports: reports.filter((r) => r.targetId === profile.id),
    stats: (stats as unknown as { totalApplicants: number; creatorsHired: number }[])[0] ?? { totalApplicants: 0, creatorsHired: 0 },
  });
}

const patchSchema = z.object({
  brandName: z.string().min(1).max(160).optional(),
  city: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  contactEmail: z.string().email().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });

  const db = getDb();
  const [before] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.id, params.id)).limit(1);
  if (!before) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await db.update(schema.brandProfiles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.brandProfiles.id, params.id));

  await recordAudit({
    actorUserId: session.user.id,
    action: "brand.edit",
    entityType: "brand",
    entityId: params.id,
    before: Object.fromEntries(Object.keys(parsed.data).map((k) => [k, (before as Record<string, unknown>)[k]])),
    after: parsed.data,
    request,
  });

  return NextResponse.json({ success: true });
}
