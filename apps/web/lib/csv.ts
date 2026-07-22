function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = value instanceof Date ? value.toISOString() : String(value);
  // A cell starting with =, +, -, or @ is interpreted as a formula by Excel/Sheets when the
  // export is opened — free-text fields here (notes, names) often originate from a KOL's/brand's
  // own bio and can't be trusted not to contain one. Prefixing with a single quote is the
  // standard mitigation: it forces the cell to render as plain text instead of evaluating.
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return lines.join("\n");
}

export function csvResponse(rows: Record<string, unknown>[], filename: string): Response {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
