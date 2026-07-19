import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateUserId } from "@/lib/currentUser";
import { getCreatorRefreshQueue } from "@/lib/queue";

/** FR-020 — request a profile-data refresh for a single creator. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const userId = await getOrCreateUserId(session.email);

  await getCreatorRefreshQueue().add(
    "CREATOR_REFRESH",
    { jobType: "CREATOR_REFRESH", creatorId: params.id, requestedBy: userId },
    { attempts: 1, removeOnComplete: 200, removeOnFail: 200 }
  );

  return NextResponse.json({ ok: true });
}
