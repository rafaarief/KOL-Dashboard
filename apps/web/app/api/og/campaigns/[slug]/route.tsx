import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

function budgetLabel(c: { budgetType: string; budgetPerCreator: string | null; budgetMin: string | null; budgetMax: string | null }): string {
  const fmt = (v: string) => `Rp${Number.parseFloat(v).toLocaleString("id-ID")}`;
  if (c.budgetType === "barter") return "Product Barter";
  if (c.budgetType === "affiliate") return "Affiliate Commission";
  if (c.budgetType === "negotiable") return "Negotiable Budget";
  if (c.budgetPerCreator) return `${fmt(c.budgetPerCreator)} / creator`;
  if (c.budgetMin && c.budgetMax) return `${fmt(c.budgetMin)}–${fmt(c.budgetMax)}`;
  return "Negotiable";
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const db = getDb();
  const [campaign] = await db
    .select({
      title: schema.campaigns.title,
      budgetType: schema.campaigns.budgetType,
      budgetPerCreator: schema.campaigns.budgetPerCreator,
      budgetMin: schema.campaigns.budgetMin,
      budgetMax: schema.campaigns.budgetMax,
      creatorCountNeeded: schema.campaigns.creatorCountNeeded,
      creatorCountAccepted: schema.campaigns.creatorCountAccepted,
      brandName: schema.brandProfiles.brandName,
      brandVerification: schema.brandProfiles.verificationStatus,
      categoryName: schema.marketplaceCategories.name,
    })
    .from(schema.campaigns)
    .innerJoin(schema.brandProfiles, eq(schema.brandProfiles.id, schema.campaigns.brandProfileId))
    .leftJoin(schema.marketplaceCategories, eq(schema.marketplaceCategories.id, schema.campaigns.categoryId))
    .where(eq(schema.campaigns.slug, params.slug))
    .limit(1);

  const title = campaign?.title ?? "Campaign on OpenCollab.id";
  const brandName = campaign?.brandName ?? "OpenCollab.id";
  const slotsRemaining = campaign ? Math.max(0, campaign.creatorCountNeeded - campaign.creatorCountAccepted) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "linear-gradient(135deg, #6B46C1 0%, #A78BFA 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.85)" }}>{brandName}</div>
          {campaign?.brandVerification === "verified" && (
            <div style={{ fontSize: 20, color: "white", background: "rgba(255,255,255,0.25)", borderRadius: 999, padding: "4px 14px" }}>Verified Brand</div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 54, fontWeight: 700, color: "white", lineHeight: 1.2, maxWidth: 900 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 32, gap: 16 }}>
          {campaign && (
            <div style={{ display: "flex", fontSize: 28, color: "white", background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 24px" }}>
              {budgetLabel(campaign)}
            </div>
          )}
          {campaign?.categoryName && (
            <div style={{ display: "flex", fontSize: 28, color: "white", background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 24px" }}>
              {campaign.categoryName}
            </div>
          )}
        </div>
        {slotsRemaining !== null && (
          <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: "rgba(255,255,255,0.85)" }}>{`${slotsRemaining} creator slots open`}</div>
        )}
        <div style={{ display: "flex", marginTop: 48, fontSize: 22, color: "rgba(255,255,255,0.7)" }}>{`opencollab.id/campaigns/${params.slug}`}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
