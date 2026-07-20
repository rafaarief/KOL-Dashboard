import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const PAGE_SIZE = 12;

export interface CampaignListParams {
  q?: string;
  category?: string;
  city?: string;
  minBudget?: string;
  maxBudget?: string;
  sort?: string;
  page?: string;
}

export async function listPublishedCampaigns(params: CampaignListParams) {
  const db = getDb();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const conditions = [eq(schema.campaigns.status, "published")];
  if (params.q) {
    conditions.push(
      or(ilike(schema.campaigns.title, `%${params.q}%`), ilike(schema.campaigns.shortDescription, `%${params.q}%`))!
    );
  }
  if (params.category) conditions.push(eq(schema.marketplaceCategories.slug, params.category));
  if (params.city) conditions.push(eq(schema.campaigns.city, params.city));
  if (params.minBudget) conditions.push(gte(schema.campaigns.budgetPerCreator, params.minBudget));
  if (params.maxBudget) conditions.push(lte(schema.campaigns.budgetPerCreator, params.maxBudget));

  const sortColumns =
    params.sort === "highest_budget"
      ? [desc(schema.campaigns.budgetPerCreator)]
      : params.sort === "closing_soon"
        ? [asc(schema.campaigns.applicationDeadline)]
        : [desc(schema.campaigns.featured), desc(schema.campaigns.publishedAt)];

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      slug: schema.campaigns.slug,
      title: schema.campaigns.title,
      shortDescription: schema.campaigns.shortDescription,
      status: schema.campaigns.status,
      city: schema.campaigns.city,
      isRemote: schema.campaigns.isRemote,
      budgetType: schema.campaigns.budgetType,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      applicationDeadline: schema.campaigns.applicationDeadline,
      compensationType: schema.campaigns.compensationType,
      categoryName: schema.marketplaceCategories.name,
      coverImageUrl: schema.campaigns.coverImageUrl,
      coverImageAlt: schema.campaigns.coverImageAlt,
      brandName: schema.brandProfiles.brandName,
      brandLogoUrl: schema.brandProfiles.logoUrl,
      brandVerification: schema.brandProfiles.verificationStatus,
      featured: schema.campaigns.featured,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(whereClause)
    .orderBy(...sortColumns)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(whereClause);

  return { rows, total: Number(count), page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(Number(count) / PAGE_SIZE)) };
}

export interface CreatorListParams {
  q?: string;
  niche?: string;
  city?: string;
  minFollowers?: string;
  availability?: string;
  sort?: string;
  page?: string;
}

export async function listActiveCreators(params: CreatorListParams) {
  const db = getDb();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const conditions = [eq(schema.creatorProfiles.status, "active")];
  if (params.q) {
    conditions.push(
      or(ilike(schema.creatorProfiles.displayName, `%${params.q}%`), ilike(schema.creatorProfiles.username, `%${params.q}%`))!
    );
  }
  if (params.niche) conditions.push(eq(schema.niches.slug, params.niche));
  if (params.city) conditions.push(eq(schema.creatorProfiles.city, params.city));
  if (params.availability) conditions.push(eq(schema.creatorProfiles.availabilityStatus, params.availability));

  const sortColumns =
    params.sort === "lowest_rate"
      ? [asc(schema.creatorProfiles.minimumBudget)]
      : [desc(schema.creatorProfiles.featured), desc(schema.creatorProfiles.createdAt)];

  const whereClause = and(...conditions);
  const followersSubquery = sql<number>`(select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa where csa.creator_profile_id = creator_profiles.id)`;

  const rows = await db
    .select({
      username: schema.creatorProfiles.username,
      displayName: schema.creatorProfiles.displayName,
      city: schema.creatorProfiles.city,
      avatarUrl: schema.creatorProfiles.avatarUrl,
      availabilityStatus: schema.creatorProfiles.availabilityStatus,
      verificationStatus: schema.creatorProfiles.verificationStatus,
      minimumBudget: schema.creatorProfiles.minimumBudget,
      slotsRemaining: schema.creatorProfiles.slotsRemaining,
      monthlyCapacity: schema.creatorProfiles.monthlyCapacity,
      primaryNicheName: schema.niches.name,
      totalFollowers: followersSubquery,
      featured: schema.creatorProfiles.featured,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.creatorProfiles)
    .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
    .leftJoin(schema.users, eq(schema.users.id, schema.creatorProfiles.userId))
    .where(
      params.minFollowers ? and(whereClause, gte(followersSubquery, Number.parseInt(params.minFollowers, 10))) : whereClause
    )
    .orderBy(...(params.sort === "highest_followers" ? [desc(followersSubquery)] : sortColumns))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.creatorProfiles)
    .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
    .where(whereClause);

  return { rows, total: Number(count), page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(Number(count) / PAGE_SIZE)) };
}

export interface BrandListParams {
  q?: string;
  industry?: string;
  city?: string;
  page?: string;
}

export async function listActiveBrands(params: BrandListParams) {
  const db = getDb();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const conditions = [eq(schema.brandProfiles.status, "active")];
  if (params.q) conditions.push(or(ilike(schema.brandProfiles.brandName, `%${params.q}%`), ilike(schema.brandProfiles.industry, `%${params.q}%`))!);
  if (params.industry) conditions.push(eq(schema.brandProfiles.industry, params.industry));
  if (params.city) conditions.push(eq(schema.brandProfiles.city, params.city));

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      slug: schema.brandProfiles.slug,
      brandName: schema.brandProfiles.brandName,
      industry: schema.brandProfiles.industry,
      city: schema.brandProfiles.city,
      logoUrl: schema.brandProfiles.logoUrl,
      verificationStatus: schema.brandProfiles.verificationStatus,
      activeCampaignCount: sql<number>`(select count(*) from campaigns c where c.brand_profile_id = brand_profiles.id and c.status = 'published')`,
      featured: schema.brandProfiles.featured,
      // "Responds Quickly" is only ever true from real review-latency data (avg <= 2 days) and
      // requires at least 3 reviewed applications — a single fast reply shouldn't earn the badge.
      respondsQuickly: sql<boolean>`(
        select count(*) filter (where ca.status <> 'submitted') >= 3
          and avg(extract(epoch from (ca.updated_at - ca.created_at)) / 86400) filter (where ca.status <> 'submitted') <= 2
        from campaign_applications ca
        inner join campaigns c on c.id = ca.campaign_id
        where c.brand_profile_id = brand_profiles.id
      )`,
    })
    .from(schema.brandProfiles)
    .where(whereClause)
    .orderBy(desc(schema.brandProfiles.featured), desc(schema.brandProfiles.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.brandProfiles).where(whereClause);

  return { rows, total: Number(count), page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(Number(count) / PAGE_SIZE)) };
}
