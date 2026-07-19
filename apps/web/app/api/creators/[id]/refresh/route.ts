// Touches the live DB on every request — never let Next.js try to statically prerender this at build time.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/currentUser";
import { getCreatorRefreshQueue } from "@/lib/queue";

/** FR-020 — request a profile-data refresh for a single creator. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getDefaultUserId();

  await getCreatorRefreshQueue().add(
    "CREATOR_REFRESH",
    { jobType: "CREATOR_REFRESH", creatorId: params.id, requestedBy: userId },
    { attempts: 1, removeOnComplete: 200, removeOnFail: 200 }
  );

  return NextResponse.json({ ok: true });
}
