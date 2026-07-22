export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { brandKpis, dailyDashboard, kolKpis } from "@/lib/outreachMetrics";

export async function GET(request: Request) {
  const session = await requireRole(["admin", "outreach_admin"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const scope = new URL(request.url).searchParams.get("scope");

  if (scope === "brand") return NextResponse.json(await brandKpis());
  if (scope === "daily") return NextResponse.json(await dailyDashboard(session.user.id));
  return NextResponse.json(await kolKpis());
}
