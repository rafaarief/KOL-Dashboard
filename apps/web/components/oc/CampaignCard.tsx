import Link from "next/link";
import { Clock, MapPin, Users, Wallet } from "lucide-react";
import { Avatar, CampaignStatusBadge, VerificationBadge, formatIDR } from "./primitives";
import { campaignVisualFor } from "@/lib/campaignVisuals";

export interface CampaignCardData {
  slug: string;
  title: string;
  shortDescription: string;
  status: string;
  city: string | null;
  isRemote: boolean;
  budgetType: string;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetPerCreator: string | null;
  creatorCountNeeded: number;
  creatorCountAccepted: number;
  applicationDeadline: Date | string | null;
  compensationType: string;
  categoryName: string | null;
  brandName: string;
  brandLogoUrl: string | null;
  brandVerification: string;
  featured?: boolean;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
}

function budgetLabel(c: CampaignCardData): string {
  if (c.budgetType === "barter") return "Product Barter";
  if (c.budgetType === "affiliate") return "Affiliate Commission";
  if (c.budgetType === "negotiable") return "Negotiable";
  if (c.budgetPerCreator) return `${formatIDR(c.budgetPerCreator)} / creator`;
  if (c.budgetMin && c.budgetMax) return `${formatIDR(c.budgetMin)}–${formatIDR(c.budgetMax)}`;
  return "Negotiable";
}

/** Returns a human urgency string ("Today", "1 day left", "3 days left") only inside the
 * closing-soon window, or null otherwise — used instead of a plain boolean badge so the
 * card actually communicates how urgent "soon" is. */
function urgencyLabel(deadline: Date | string | null): string | null {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0 || days > 5) return null;
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const slotsRemaining = Math.max(0, campaign.creatorCountNeeded - campaign.creatorCountAccepted);
  const urgency = urgencyLabel(campaign.applicationDeadline);
  const visual = campaignVisualFor(campaign.categoryName);
  const VisualIcon = visual.icon;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-oc border border-oc-border bg-oc-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {campaign.featured && (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-oc-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          ★ Featured
        </span>
      )}

      <Link href={`/campaigns/${campaign.slug}`} className="relative block aspect-[16/9] w-full overflow-hidden">
        {campaign.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered external
          // URL; next/image would require a wildcard remotePatterns allowlist for this one field,
          // so this follows the same plain-<img> convention already used by Avatar/logo rendering.
          <img
            src={campaign.coverImageUrl}
            alt={campaign.coverImageAlt || campaign.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${visual.gradient} transition duration-300 group-hover:scale-105 ${campaign.coverImageUrl ? "hidden" : ""}`}
        >
          <VisualIcon className="h-10 w-10 text-white/70" strokeWidth={1.5} aria-hidden="true" />
        </div>
        {campaign.categoryName && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {campaign.categoryName}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Avatar name={campaign.brandName} url={campaign.brandLogoUrl} size={24} />
          <span className="text-sm font-medium text-oc-ink">{campaign.brandName}</span>
          <VerificationBadge status={campaign.brandVerification} />
        </div>

        <Link href={`/campaigns/${campaign.slug}`} className="mt-3 block">
          <h3 className="font-display text-base font-bold text-oc-ink line-clamp-2">{campaign.title}</h3>
        </Link>
        <p className="mt-1 text-sm text-oc-ink-muted line-clamp-2">{campaign.shortDescription}</p>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-oc-ink-muted">
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {budgetLabel(campaign)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {slotsRemaining} of {campaign.creatorCountNeeded} slots
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {campaign.isRemote ? "Remote" : (campaign.city ?? "On-site")}
          </span>
          {urgency && (
            <span className="flex items-center gap-1.5 font-medium text-red-600">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {urgency}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-oc-border pt-4">
          <CampaignStatusBadge status={campaign.status} />
          <Link
            href={`/campaigns/${campaign.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-oc-700 transition group-hover:gap-1.5 hover:underline"
          >
            View Campaign <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
