import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, schema } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_PATH = path.join(__dirname, "..", "seed-data", "boothyclub-kol-database.csv");

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

function normalizeStatus(raw: string | null): string | null {
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered.includes("progress")) return "On Progress";
  if (lowered.includes("post")) return "Posted";
  if (lowered.includes("visit")) return "Visited";
  return raw;
}

// Column order (header on row 5 of the sheet): NO, MONTH, WEEK, NAME, PLATFORM, TIER, BRANCH,
// VISIT DATE, DEADLINE, STATUS, ACCOUNT LINK, POST LINK, CURRENT STATUS
function parseRow(cols: string[], sourceRowNumber: number) {
  const name = clean(cols[3]);
  if (!name) return null;

  const status = clean(cols[9]);

  return {
    sourceRowNumber,
    month: clean(cols[1]),
    week: clean(cols[2]),
    name,
    platform: clean(cols[4]),
    tier: clean(cols[5]),
    branch: clean(cols[6]),
    visitDate: clean(cols[7]),
    deadline: clean(cols[8]),
    status,
    normalizedStatus: normalizeStatus(status),
    accountLink: clean(cols[10]),
    postLink: clean(cols[11]),
    currentStatus: clean(cols[12]),
  };
}

async function main() {
  const csvPath = process.argv[2] ?? DEFAULT_CSV_PATH;
  const text = await readFile(csvPath, "utf-8");
  const rows = parseCsv(text);

  // Skip the sheet's title/attribution preamble (rows 0-3) and header (row 4).
  const dataRows = rows.slice(5);

  const parsed = dataRows
    .map((cols, index) => parseRow(cols, index + 1))
    .filter((row): row is NonNullable<typeof row> => row !== null);

  console.log(`Parsed ${parsed.length} usable rows out of ${dataRows.length} CSV rows.`);

  const db = getDb();
  let upserted = 0;

  for (const row of parsed) {
    await db
      .insert(schema.kolVisits)
      .values(row)
      .onConflictDoUpdate({
        target: schema.kolVisits.sourceRowNumber,
        set: { ...row, updatedAt: new Date() },
      });
    upserted += 1;
  }

  console.log(`Upserted ${upserted} KOL visit rows.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
