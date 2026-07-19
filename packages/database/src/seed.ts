import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const DEFAULT_CATEGORIES = [
  "Hotel",
  "Restaurant",
  "Cafe",
  "Photobooth",
  "Salon",
  "Laundry",
  "Dental",
  "Clinic",
  "Gym",
  "Optik",
  "Minimarket",
  "Apotek",
  "Building Store",
  "Printing",
  "Custom",
];

const CITIES = [
  { city: "Jakarta Selatan", province: "DKI Jakarta" },
  { city: "Bandung", province: "Jawa Barat" },
  { city: "Surabaya", province: "Jawa Timur" },
  { city: "Yogyakarta", province: "DI Yogyakarta" },
  { city: "Denpasar", province: "Bali" },
  { city: "Semarang", province: "Jawa Tengah" },
];

const CRM_STATUSES = ["New", "Not Contacted", "Contacted", "Interested", "Meeting", "Negotiation", "Won", "Lost"];

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function seededPhone(index: number): { phone: string; phoneType: string; isWhatsappCandidate: boolean } {
  if (index % 5 === 0) {
    return { phone: `021${(1000000 + index).toString().slice(0, 7)}`, phoneType: "landline", isWhatsappCandidate: false };
  }
  return { phone: `+62812${(30000000 + index * 137).toString().slice(0, 8)}`, phoneType: "mobile", isWhatsappCandidate: true };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  const insertedCategories = await db
    .insert(schema.categories)
    .values(DEFAULT_CATEGORIES.map((categoryName) => ({ categoryName })))
    .onConflictDoNothing({ target: schema.categories.categoryName })
    .returning();

  const categories = insertedCategories.length > 0 ? insertedCategories : await db.select().from(schema.categories);

  const businessRows = Array.from({ length: 45 }, (_, index) => {
    const category = pick(categories, index);
    const location = pick(CITIES, index);
    const businessName = `${category.categoryName} ${location.city} ${index + 1}`;
    const { phone, phoneType, isWhatsappCandidate } = seededPhone(index);
    const hasWebsite = index % 3 === 0;
    const hasInstagram = index % 2 === 0;
    const rating = (3 + ((index * 7) % 21) / 10).toFixed(1);

    return {
      businessName,
      normalizedName: normalize(businessName),
      categoryId: category.id,
      phone,
      phoneType,
      isWhatsappCandidate,
      website: hasWebsite ? `https://${normalize(businessName).replace(/ /g, "")}.example.com` : null,
      instagram: hasInstagram ? `@${normalize(businessName).replace(/ /g, "")}` : null,
      email: hasWebsite ? `hello@${normalize(businessName).replace(/ /g, "")}.example.com` : null,
      rating,
      reviewCount: (index * 13) % 250,
      status: "operational",
      address: `Jl. Contoh No. ${index + 1}`,
      district: `Kecamatan ${index % 6 + 1}`,
      city: location.city,
      province: location.province,
      postalCode: `${10000 + index}`,
      leadScore: Math.min(100, 20 + ((index * 11) % 80)),
      crmStatus: pick(CRM_STATUSES, index),
    };
  });

  await db.insert(schema.businesses).values(businessRows);

  console.log(`Seeded ${categories.length} categories and ${businessRows.length} businesses.`);
  await client.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
