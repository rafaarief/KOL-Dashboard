import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, schema } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_PATH = path.join(__dirname, "..", "seed-data", "blokm-nano-kol.csv");

/** Minimal RFC4180 CSV parser: handles quoted fields, embedded commas/newlines, and "" escapes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // skip; \n handles the line break
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function clean(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stripHandle(username: string | null): string | null {
  if (!username) return null;
  return username.replace(/^@/, "").trim() || null;
}

function toTitleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function normalizeGender(raw: string | null): string | null {
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered.includes("perempuan") || lowered.includes("female") || lowered.includes("wanita")) return "Perempuan";
  if (lowered.includes("laki") || lowered.includes("male")) return "Laki-laki";
  if (lowered.includes("couple")) return "Couple";
  return null;
}

function parseFollowerCount(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s || s === "-") return null;

  const kMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*[kK]$/);
  if (kMatch) return Math.round(Number.parseFloat(kMatch[1].replace(",", ".")) * 1000);

  const ribuMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*ribu$/i);
  if (ribuMatch) return Math.round(Number.parseFloat(ribuMatch[1].replace(",", ".")) * 1000);

  if (/^\d{1,3}(,\d{3})+$/.test(s)) return Number.parseInt(s.replace(/,/g, ""), 10);
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number.parseInt(s.replace(/\./g, ""), 10);
  if (/^\d+$/.test(s)) return Number.parseInt(s, 10);

  return null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Foodies: ["foodie", "food", "kuliner", "f&b", "fnb", "culinary"],
  Lifestyle: ["lifestyle", "life style"],
  Beauty: ["beauty"],
  Fashion: ["fashion"],
  "Travel / Place to go": ["place to go", "placetogo", "travel", "trip", "wisata", "visit"],
  "Family / Mom & Kids": ["family", "mom & kid", "mom n kid", "mom and kid"],
  Couple: ["couple"],
  Comedy: ["comedy"],
  Education: ["education"],
  "Gen Z": ["gen z", "genz"],
  "Reviewer / Entrepreneur": ["reviewer", "review", "entrepreuner", "entrepreneur", "womenpreuner"],
  Music: ["music"],
  Dance: ["dance"],
  Sport: ["sport"],
  "Daily Vlog": ["daily activity", "daily vlog", "digital diaries", "daily life"],
};

function categorize(...nicheTexts: (string | null)[]): string[] {
  const combined = nicheTexts.filter(Boolean).join(" ").toLowerCase();
  if (!combined) return ["Uncategorized"];

  const matched = new Set<string>();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => combined.includes(keyword))) matched.add(category);
  }

  return matched.size > 0 ? Array.from(matched).sort() : ["Other"];
}

interface ParsedRow {
  sourceRowNumber: number;
  fullName: string | null;
  age: string | null;
  gender: string | null;
  normalizedGender: string | null;
  domisili: string | null;
  tiktokUsername: string | null;
  tiktokUrl: string | null;
  tiktokFollowersRaw: string | null;
  tiktokFollowersCount: number | null;
  nicheTiktokRaw: string | null;
  erTiktokRaw: string | null;
  avgViewsTiktokRaw: string | null;
  instagramUsername: string | null;
  instagramUrl: string | null;
  instagramFollowersRaw: string | null;
  instagramFollowersCount: number | null;
  nicheInstagramRaw: string | null;
  erInstagramRaw: string | null;
  avgViewsInstagramRaw: string | null;
  contentReviewLink: string | null;
  phoneNumber: string | null;
  note: string | null;
  categories: string[];
}

// Column order (header): No, Nama Lengkap, Usia, Jenis Kelamin, Domisili, Username TikTok,
// Link TT, Followers TT, Niche TT, ER TT, Avg Views TT, Username IG, Link IG, Followers IG,
// Niche IG, ER IG, Avg Views IG, Link Konten Review Makanan, No HP, NOTE
function parseRow(cols: string[]): ParsedRow | null {
  const sourceRowNumber = Number.parseInt(cols[0]?.trim() ?? "", 10);
  if (Number.isNaN(sourceRowNumber)) return null;

  const fullName = clean(cols[1]);
  const tiktokUsername = stripHandle(clean(cols[5]));
  const instagramUsername = stripHandle(clean(cols[11]));

  if (!fullName && !tiktokUsername && !instagramUsername) return null;

  const gender = clean(cols[3]);
  const nicheTiktokRaw = clean(cols[8]);
  const nicheInstagramRaw = clean(cols[14]);
  const tiktokFollowersRaw = clean(cols[7]);
  const instagramFollowersRaw = clean(cols[13]);

  return {
    sourceRowNumber,
    fullName,
    age: clean(cols[2]),
    gender,
    normalizedGender: normalizeGender(gender),
    domisili: toTitleCase(clean(cols[4])),
    tiktokUsername,
    tiktokUrl: clean(cols[6]),
    tiktokFollowersRaw,
    tiktokFollowersCount: parseFollowerCount(tiktokFollowersRaw),
    nicheTiktokRaw,
    erTiktokRaw: clean(cols[9]),
    avgViewsTiktokRaw: clean(cols[10]),
    instagramUsername,
    instagramUrl: clean(cols[12]),
    instagramFollowersRaw,
    instagramFollowersCount: parseFollowerCount(instagramFollowersRaw),
    nicheInstagramRaw,
    erInstagramRaw: clean(cols[15]),
    avgViewsInstagramRaw: clean(cols[16]),
    contentReviewLink: clean(cols[17]),
    phoneNumber: clean(cols[18])?.replace(/^"+|"+$/g, "") ?? null,
    note: clean(cols[19]),
    categories: categorize(nicheTiktokRaw, nicheInstagramRaw),
  };
}

async function main() {
  const csvPath = process.argv[2] ?? DEFAULT_CSV_PATH;
  const text = await readFile(csvPath, "utf-8");
  const rows = parseCsv(text);
  const [, ...dataRows] = rows; // drop header

  const parsed = dataRows.map(parseRow).filter((row): row is ParsedRow => row !== null);

  console.log(`Parsed ${parsed.length} usable rows out of ${dataRows.length} CSV rows.`);

  const db = getDb();
  let inserted = 0;

  for (const row of parsed) {
    await db
      .insert(schema.nanoKols)
      .values({ ...row, categories: row.categories })
      .onConflictDoUpdate({
        target: schema.nanoKols.sourceRowNumber,
        set: { ...row, categories: row.categories, updatedAt: new Date() },
      });
    inserted += 1;
  }

  console.log(`Upserted ${inserted} nano KOL rows.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
