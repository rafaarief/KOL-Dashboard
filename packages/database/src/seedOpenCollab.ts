import bcryptjs from "bcryptjs";
const { hash } = bcryptjs;
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/** Seeds the OpenCollab.id marketplace with deterministic, fictional Indonesian creator/brand
 * data. Idempotent: every insert targets a unique constraint with onConflictDoNothing, so
 * running this repeatedly does not duplicate rows. Does not touch KOL Finder / Business Leads
 * data (creators, businesses, nano_kols, etc.) at all. */

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

const NICHES = [
  "F&B",
  "Fashion",
  "Beauty",
  "Lifestyle",
  "Travel",
  "Technology",
  "Finance",
  "Gaming",
  "Parenting",
  "Fitness",
  "Photography",
  "Automotive",
  "Education",
  "Entertainment",
  "Home and Living",
] as const;

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Threads", "X", "Facebook"] as const;

const COLLABORATION_TYPES = [
  "Paid Collaboration",
  "Barter",
  "Affiliate",
  "Event Attendance",
  "UGC",
  "Brand Ambassador",
  "Product Review",
  "Live Streaming",
] as const;

const MARKETPLACE_CATEGORIES = [
  "F&B",
  "Beauty & Skincare",
  "Fashion",
  "Travel",
  "Technology",
  "Health & Fitness",
  "Parenting & Family",
  "Automotive",
  "Education",
  "Home & Living",
] as const;

const CITIES = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Bali", "Medan", "Makassar", "Semarang", "Malang", "Tangerang"] as const;

const CREATORS: Array<{ fullName: string; username: string }> = [
  { fullName: "Nadia Putri", username: "nadiadaily" },
  { fullName: "Dimas Rangga", username: "dimasrangga" },
  { fullName: "Sari Ayu Lestari", username: "sariayul" },
  { fullName: "Bagus Wicaksono", username: "baguswic" },
  { fullName: "Wulan Kartika", username: "wulankartika" },
  { fullName: "Fajar Nugroho", username: "fajarnugroho" },
  { fullName: "Intan Permata", username: "intanpermata" },
  { fullName: "Reza Pratama", username: "rezapratama" },
  { fullName: "Devi Anggraini", username: "devianggraini" },
  { fullName: "Yoga Saputra", username: "yogasaputra" },
  { fullName: "Citra Maharani", username: "citramaharani" },
  { fullName: "Bima Setiawan", username: "bimasetiawan" },
  { fullName: "Larasati Wijaya", username: "larasatiw" },
  { fullName: "Hendra Gunawan", username: "hendragunawan" },
  { fullName: "Maya Puspita", username: "mayapuspita" },
  { fullName: "Aditya Firmansyah", username: "adityaf" },
  { fullName: "Sinta Amelia", username: "sintaamelia" },
  { fullName: "Farhan Maulana", username: "farhanmaulana" },
  { fullName: "Kirana Dewi", username: "kiranadewi" },
  { fullName: "Rendra Kusuma", username: "rendrakusuma" },
  { fullName: "Salsa Nabila", username: "salsanabila" },
  { fullName: "Wahyu Hidayat", username: "wahyuhidayat" },
  { fullName: "Dinda Ayunda", username: "dindaayunda" },
  { fullName: "Arya Wibisono", username: "aryawibisono" },
  { fullName: "Gita Savitri", username: "gitasavitri" },
  { fullName: "Fikri Ramadhan", username: "fikriramadhan" },
  { fullName: "Anisa Rahmawati", username: "anisarahma" },
  { fullName: "Galih Prasetyo", username: "galihprasetyo" },
  { fullName: "Putri Handayani", username: "putrihandayani" },
  { fullName: "Rizky Ananda", username: "rizkyananda" },
];

const BRANDS = [
  "Kopi Rona",
  "Nusa Skin",
  "Loka Active",
  "Dapur Temu",
  "Cerita Kamera",
  "Rumah Senja",
  "Gaya Lokal",
  "Jalan Yuk",
  "NusaTech",
  "FitKita",
  "Bumi Baby",
  "Motora",
  "BelajarBareng",
  "Suara Studio",
  "Saji Nusantara",
  "Warung Kita",
  "Sepatu Nadi",
  "Kain Raya",
  "Rasa Nusantara",
  "Gerobak Kopi",
  "Elektronik Jaya",
  "Klinik Sehat",
  "Gymnesia",
  "Baby Ceria",
  "Otomotif Prima",
  "Kelas Pintar",
  "Studio Kreatif",
  "Sarapan Pagi",
  "Griya Asri",
  "Teknologi Maju",
] as const;

const BRAND_INDUSTRIES = [
  "F&B",
  "Beauty & Skincare",
  "Fashion",
  "Travel",
  "Technology",
  "Health & Fitness",
  "Parenting & Family",
  "Automotive",
  "Education",
  "Home & Living",
] as const;

const CAMPAIGN_TEMPLATES = [
  { title: "Looking for {n} {city} F&B Creators", categoryIdx: 0 },
  { title: "TikTok Product Review for Local Skincare", categoryIdx: 1 },
  { title: "{city} Fashion Creator Campaign", categoryIdx: 2 },
  { title: "{city} Travel Content Collaboration", categoryIdx: 3 },
  { title: "UGC Creators for Fitness Application", categoryIdx: 5 },
  { title: "Parenting Creators for Baby Product Launch", categoryIdx: 6 },
  { title: "Micro Creators Needed for Coffee Shop Opening", categoryIdx: 0 },
  { title: "Tech Review Campaign for Productivity Application", categoryIdx: 4 },
] as const;

const BUDGET_OPTIONS = [
  { budgetType: "fixed", budgetPerCreator: "300000", budgetMin: null, budgetMax: null },
  { budgetType: "range", budgetPerCreator: null, budgetMin: "500000", budgetMax: "800000" },
  { budgetType: "fixed", budgetPerCreator: "1000000", budgetMin: null, budgetMax: null },
  { budgetType: "barter", budgetPerCreator: "250000", budgetMin: null, budgetMax: null },
  { budgetType: "affiliate", budgetPerCreator: null, budgetMin: null, budgetMax: null },
  { budgetType: "negotiable", budgetPerCreator: null, budgetMin: null, budgetMax: null },
] as const;

const SEED_DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "OpenCollab2026!";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  // --- taxonomy ---
  await db.insert(schema.niches).values(NICHES.map((name) => ({ name, slug: slugify(name) }))).onConflictDoNothing({ target: schema.niches.name });
  await db.insert(schema.platforms).values(PLATFORMS.map((name) => ({ name, slug: slugify(name) }))).onConflictDoNothing({ target: schema.platforms.name });
  await db
    .insert(schema.collaborationTypes)
    .values(COLLABORATION_TYPES.map((name) => ({ name, slug: slugify(name) })))
    .onConflictDoNothing({ target: schema.collaborationTypes.name });
  await db
    .insert(schema.marketplaceCategories)
    .values(MARKETPLACE_CATEGORIES.map((name) => ({ name, slug: slugify(name) })))
    .onConflictDoNothing({ target: schema.marketplaceCategories.name });

  const niches = await db.select().from(schema.niches);
  const platforms = await db.select().from(schema.platforms);
  const categories = await db.select().from(schema.marketplaceCategories);

  // --- demo accounts ---
  const demoPasswordHash = await hash(SEED_DEMO_PASSWORD, 10);
  const demoAccounts = [
    { email: "admin@opencollab.id", fullName: "OpenCollab Admin", role: "admin" },
    { email: "creator.demo@opencollab.id", fullName: "Demo Creator", role: "creator" },
    { email: "brand.demo@opencollab.id", fullName: "Demo Brand Owner", role: "brand" },
  ];
  for (const account of demoAccounts) {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, account.email)).limit(1);
    if (!existing) {
      await db.insert(schema.users).values({ ...account, passwordHash: demoPasswordHash });
    }
  }
  const [demoCreatorUser] = await db.select().from(schema.users).where(eq(schema.users.email, "creator.demo@opencollab.id")).limit(1);
  const [demoBrandUser] = await db.select().from(schema.users).where(eq(schema.users.email, "brand.demo@opencollab.id")).limit(1);

  // --- 30 creators ---
  const creatorProfileIds: string[] = [];
  for (let i = 0; i < CREATORS.length; i += 1) {
    const creator = CREATORS[i];
    const city = pick(CITIES, i);
    const niche = pick(niches, i);
    const isDemo = i === 0;

    let userId: string;
    if (isDemo && demoCreatorUser) {
      userId = demoCreatorUser.id;
    } else {
      const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, `${creator.username}@creators.opencollab.id`)).limit(1);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const [newUser] = await db
          .insert(schema.users)
          .values({
            email: `${creator.username}@creators.opencollab.id`,
            fullName: creator.fullName,
            role: "creator",
            passwordHash: demoPasswordHash,
          })
          .returning({ id: schema.users.id });
        userId = newUser.id;
      }
    }

    const [existingProfile] = await db.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.username, creator.username)).limit(1);
    let creatorProfileId: string;
    if (existingProfile) {
      creatorProfileId = existingProfile.id;
    } else {
      const availability = ["open", "open", "open", "limited", "fully_booked"][i % 5];
      const [inserted] = await db
        .insert(schema.creatorProfiles)
        .values({
          userId,
          username: creator.username,
          displayName: creator.fullName,
          city,
          bio: `${creator.fullName} is a ${niche.name} content creator based in ${city}.`,
          primaryNicheId: niche.id,
          availabilityStatus: availability,
          monthlyCapacity: 4 + (i % 5),
          slotsRemaining: Math.max(0, 4 + (i % 5) - (i % 4)),
          minimumBudget: String(200000 + (i % 10) * 50000),
          acceptsBarter: i % 3 === 0,
          acceptsAffiliate: i % 2 === 0,
          acceptsPaid: true,
          acceptsEventAttendance: i % 4 === 0,
          acceptsAmbassador: i % 6 === 0,
          verificationStatus: i % 5 === 0 ? "verified" : "unverified",
          featured: i % 7 === 0,
        })
        .returning({ id: schema.creatorProfiles.id });
      creatorProfileId = inserted.id;

      const tiktokFollowers = 5000 + i * 1731;
      const igFollowers = 3000 + i * 987;
      await db
        .insert(schema.creatorSocialAccounts)
        .values([
          {
            creatorProfileId,
            platformId: platforms.find((p) => p.name === "TikTok")!.id,
            username: creator.username,
            profileUrl: `https://www.tiktok.com/@${creator.username}`,
            followerCount: tiktokFollowers,
            averageViews: Math.round(tiktokFollowers * 0.3),
            engagementRate: (4 + (i % 6)).toString(),
            isPrimary: true,
          },
          {
            creatorProfileId,
            platformId: platforms.find((p) => p.name === "Instagram")!.id,
            username: creator.username,
            profileUrl: `https://instagram.com/${creator.username}`,
            followerCount: igFollowers,
            averageViews: Math.round(igFollowers * 0.2),
            engagementRate: (3 + (i % 5)).toString(),
            isPrimary: false,
          },
        ])
        .onConflictDoNothing();

      await db.insert(schema.creatorRateCards).values([
        { creatorProfileId, deliverableType: "TikTok video", price: String(300000 + i * 10000), visibility: "starting_from" },
        { creatorProfileId, deliverableType: "Instagram Reel", price: String(400000 + i * 10000), visibility: "starting_from" },
        { creatorProfileId, deliverableType: "Instagram Feed post", price: String(250000 + i * 8000), visibility: "negotiable" },
      ]);

      await db.insert(schema.creatorPortfolioItems).values([
        {
          creatorProfileId,
          title: `${niche.name} campaign highlight`,
          description: `A recent ${niche.name.toLowerCase()} collaboration in ${city}.`,
          linkUrl: `https://www.tiktok.com/@${creator.username}/video/000000${i}`,
        },
      ]);
    }
    creatorProfileIds.push(creatorProfileId);
  }

  // --- 30 brands ---
  const brandProfileIds: string[] = [];
  for (let i = 0; i < BRANDS.length; i += 1) {
    const brandName = BRANDS[i];
    const slug = slugify(brandName);
    const city = pick(CITIES, i + 3);
    const industry = pick(BRAND_INDUSTRIES, i);
    const isDemo = i === 0;

    let userId: string;
    if (isDemo && demoBrandUser) {
      userId = demoBrandUser.id;
    } else {
      const brandEmail = `${slug}@brands.opencollab.id`;
      const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, brandEmail)).limit(1);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const [newUser] = await db
          .insert(schema.users)
          .values({ email: brandEmail, fullName: `${brandName} Team`, role: "brand", passwordHash: demoPasswordHash })
          .returning({ id: schema.users.id });
        userId = newUser.id;
      }
    }

    const [existingBrand] = await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.slug, slug)).limit(1);
    let brandProfileId: string;
    if (existingBrand) {
      brandProfileId = existingBrand.id;
    } else {
      const [inserted] = await db
        .insert(schema.brandProfiles)
        .values({
          userId,
          slug,
          brandName,
          industry,
          city,
          description: `${brandName} is a fictional ${industry} brand based in ${city}, seeded for OpenCollab.id demo purposes.`,
          verificationStatus: i % 4 === 0 ? "verified" : "unverified",
          featured: i % 8 === 0,
        })
        .returning({ id: schema.brandProfiles.id });
      brandProfileId = inserted.id;
    }
    brandProfileIds.push(brandProfileId);
  }

  // --- 24 campaigns (8 templates x 3 rotations across brands/cities) ---
  const campaignIds: string[] = [];
  let campaignIndex = 0;
  for (let round = 0; round < 3; round += 1) {
    for (const template of CAMPAIGN_TEMPLATES) {
      const city = pick(CITIES, campaignIndex);
      const brandId = brandProfileIds[campaignIndex % brandProfileIds.length];
      const category = categories[template.categoryIdx % categories.length];
      const budget = pick(BUDGET_OPTIONS, campaignIndex);
      const creatorsNeeded = 3 + (campaignIndex % 5);
      const title = template.title.replace("{n}", String(creatorsNeeded)).replace("{city}", city);
      const slug = `${slugify(title)}-${campaignIndex}`;

      const [existing] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.slug, slug)).limit(1);
      let campaignId: string;
      if (existing) {
        campaignId = existing.id;
      } else {
        const deadlineDays = 5 + (campaignIndex % 20);
        const [inserted] = await db
          .insert(schema.campaigns)
          .values({
            brandProfileId: brandId,
            title,
            slug,
            categoryId: category.id,
            shortDescription: `${title} — collaborate with ${brandProfileIds.indexOf(brandId) >= 0 ? BRANDS[brandProfileIds.indexOf(brandId)] : "our brand"}.`,
            fullDescription: `We're looking for ${creatorsNeeded} creators in ${city} to collaborate on ${title.toLowerCase()}. Deliverables and requirements are listed below. Reach out with your best pitch!`,
            locationType: campaignIndex % 3 === 0 ? "remote" : "onsite",
            city: campaignIndex % 3 === 0 ? null : city,
            isRemote: campaignIndex % 3 === 0,
            creatorCountNeeded: creatorsNeeded,
            budgetType: budget.budgetType,
            budgetMin: budget.budgetMin,
            budgetMax: budget.budgetMax,
            budgetPerCreator: budget.budgetPerCreator,
            compensationType: budget.budgetType === "barter" ? "barter" : budget.budgetType === "affiliate" ? "affiliate" : "paid",
            deliverables: ["1 TikTok video", "1 Instagram Story"],
            requirements: "Must disclose collaboration per platform ad guidelines.",
            minimumFollowers: 5000,
            status: "published",
            publishedAt: new Date(),
            applicationDeadline: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
            contentDeadline: new Date(Date.now() + (deadlineDays + 14) * 24 * 60 * 60 * 1000),
          })
          .returning({ id: schema.campaigns.id });
        campaignId = inserted.id;

        await db
          .insert(schema.campaignNiches)
          .values({ campaignId, nicheId: pick(niches, campaignIndex).id })
          .onConflictDoNothing();
        await db
          .insert(schema.campaignPlatforms)
          .values([
            { campaignId, platformId: platforms.find((p) => p.name === "TikTok")!.id },
            { campaignId, platformId: platforms.find((p) => p.name === "Instagram")!.id },
          ])
          .onConflictDoNothing();
      }
      campaignIds.push(campaignId);
      campaignIndex += 1;
    }
  }

  // --- 80 applications, spread deterministically across campaigns/creators ---
  let applicationsCreated = 0;
  outer: for (let offset = 0; offset < creatorProfileIds.length; offset += 1) {
    for (let c = 0; c < campaignIds.length; c += 1) {
      if (applicationsCreated >= 80) break outer;
      // Deterministic sparse pairing: skip most combinations so ~80 total are created.
      if ((offset * 7 + c * 3) % 9 !== 0) continue;

      const campaignId = campaignIds[c];
      const creatorProfileId = creatorProfileIds[offset];
      const statusCycle = ["submitted", "viewed", "shortlisted", "accepted", "rejected"];

      const existingApplications = await db
        .select()
        .from(schema.campaignApplications)
        .where(eq(schema.campaignApplications.campaignId, campaignId))
        .limit(1000);
      if (existingApplications.some((row) => row.creatorProfileId === creatorProfileId)) continue;

      await db
        .insert(schema.campaignApplications)
        .values({
          campaignId,
          creatorProfileId,
          pitch: "I'd love to collaborate on this campaign — my audience matches your target demographic closely.",
          proposedRate: String(300000 + ((offset + c) % 10) * 50000),
          estimatedDeliveryDays: 5 + ((offset + c) % 10),
          status: pick(statusCycle, offset + c),
        })
        .onConflictDoNothing();
      applicationsCreated += 1;
    }
  }

  // --- 10 invitations (brand invites creator directly, distinct from applications) ---
  let invitationsCreated = 0;
  outer2: for (let c = 0; c < campaignIds.length; c += 1) {
    for (let offset = 0; offset < creatorProfileIds.length; offset += 1) {
      if (invitationsCreated >= 10) break outer2;
      if ((c * 5 + offset * 11) % 23 !== 0) continue;

      const campaignId = campaignIds[c];
      const creatorProfileId = creatorProfileIds[offset];
      const [campaignRow] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId)).limit(1);
      if (!campaignRow) continue;

      await db
        .insert(schema.campaignInvitations)
        .values({
          campaignId,
          creatorProfileId,
          brandProfileId: campaignRow.brandProfileId,
          message: "We'd love to have you collaborate with us on this campaign!",
          status: "pending",
        })
        .onConflictDoNothing();
      invitationsCreated += 1;
    }
  }

  // --- feature flags for future monetization ---
  await db
    .insert(schema.featureFlags)
    .values([
      { key: "paid_campaign_posting", enabled: false, description: "Charge brands ~Rp10,000 to publish a campaign." },
      { key: "collaboration_success_fee", enabled: false, description: "Charge a success fee on completed collaborations." },
      { key: "featured_campaigns_paid", enabled: false, description: "Featured campaign placements as a paid upsell." },
      { key: "featured_creators_paid", enabled: false, description: "Featured creator placements as a paid upsell." },
      { key: "paid_verification", enabled: false, description: "Charge for expedited/manual verification review." },
    ])
    .onConflictDoNothing({ target: schema.featureFlags.key });

  console.log(`Seeded ${creatorProfileIds.length} creators, ${brandProfileIds.length} brands, ${campaignIds.length} campaigns, ${applicationsCreated} applications, ${invitationsCreated} invitations.`);
  console.log(`Demo accounts: admin@opencollab.id, creator.demo@opencollab.id, brand.demo@opencollab.id (password set via SEED_DEMO_PASSWORD env var).`);
  await client.end();
}

main().catch((error) => {
  console.error("OpenCollab seed failed:", error);
  process.exit(1);
});
