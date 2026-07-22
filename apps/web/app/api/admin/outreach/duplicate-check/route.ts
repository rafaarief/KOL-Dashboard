export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { findBrandDuplicates, findKolDuplicates } from "@/lib/outreachDuplicateCheck";

export async function GET(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "brand" ? "brand" : "kol";
  const input = {
    email: url.searchParams.get("email") ?? undefined,
    phone: url.searchParams.get("phone") ?? undefined,
    instagramUrl: url.searchParams.get("instagramUrl") ?? undefined,
    tiktokUrl: url.searchParams.get("tiktokUrl") ?? undefined,
    excludeOutreachId: url.searchParams.get("excludeOutreachId") ?? undefined,
  };

  const matches = type === "brand" ? await findBrandDuplicates(input) : await findKolDuplicates(input);
  return NextResponse.json({ matches });
}
