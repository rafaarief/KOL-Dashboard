import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Explicit route instead of the opengraph-image.tsx file convention — that convention does
 * not get discovered by Next 14.2's dev/build router when nested inside both a route group
 * ((public)) and a dynamic segment ([username]) at once (reproduced with a zero-dependency
 * minimal repro before writing this workaround). Referenced directly from generateMetadata's
 * openGraph.images / twitter.images instead of relying on auto-discovery. */
export async function GET(_request: Request, { params }: { params: { username: string } }) {
  const db = getDb();
  const [creator] = await db
    .select({
      displayName: schema.creatorProfiles.displayName,
      city: schema.creatorProfiles.city,
      headline: schema.creatorProfiles.headline,
      verificationStatus: schema.creatorProfiles.verificationStatus,
      primaryNicheName: schema.niches.name,
    })
    .from(schema.creatorProfiles)
    .leftJoin(schema.niches, eq(schema.niches.id, schema.creatorProfiles.primaryNicheId))
    .where(eq(schema.creatorProfiles.username, params.username))
    .limit(1);

  const displayName = creator?.displayName ?? params.username;
  const headline =
    creator?.headline || [creator?.primaryNicheName ? `${creator.primaryNicheName} Creator` : "Creator", creator?.city].filter(Boolean).join(" • ");
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #6B46C1 0%, #A78BFA 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            color: "white",
            fontSize: 64,
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: "white" }}>{displayName}</div>
          {creator?.verificationStatus === "verified" && (
            <div style={{ fontSize: 28, color: "white", background: "rgba(255,255,255,0.25)", borderRadius: 999, padding: "6px 18px" }}>Verified</div>
          )}
        </div>
        {headline && <div style={{ marginTop: 16, fontSize: 30, color: "rgba(255,255,255,0.9)" }}>{headline}</div>}
        <div style={{ marginTop: 48, fontSize: 24, color: "rgba(255,255,255,0.8)" }}>{`opencollab.id/creators/${params.username}`}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
