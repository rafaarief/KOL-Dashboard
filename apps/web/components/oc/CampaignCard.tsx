import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Avatar, CampaignStatusBadge, VerificationBadge, formatIDR, tileAt } from "./primitives";
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
  applicantCount?: number;
}

function budgetLabel(c: CampaignCardData): string {
  if (c.budgetType === "barter") return "Product Barter";
  if (c.budgetType === "affiliate") return "Affiliate Commission";
  if (c.budgetType === "negotiable") return "Negotiable";
  if (c.budgetPerCreator) return formatIDR(c.budgetPerCreator);
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

export function CampaignCard({ campaign, index = 0 }: { campaign: CampaignCardData; index?: number }) {
  const urgency = urgencyLabel(campaign.applicationDeadline);
  const visual = campaignVisualFor(campaign.categoryName);
  const VisualIcon = visual.icon;
  const meta = campaign.isRemote ? "Remote" : (campaign.city ?? "On-site");
  const slotsRemaining = Math.max(0, campaign.creatorCountNeeded - campaign.creatorCountAccepted);

  return (
    <div className={`group relative flex flex-col rounded-oc p-[18px] transition duration-200 hover:-translate-y-1 hover:shadow-oc ${tileAt(index)}`}>
      {campaign.featured && (
        <span className="absolute left-6 top-6 z-10 inline-flex items-center rounded-full bg-oc-dark px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          ★ Featured
        </span>
      )}

      <Link href={`/campaigns/${campaign.slug}`} className="relative block h-[180px] w-full overflow-hidden rounded-oc-input">
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
          className={`flex h-full w-full items-center justify-center bg-white/35 transition duration-300 group-hover:scale-105 ${campaign.coverImageUrl ? "hidden" : ""}`}
        >
          <VisualIcon className="h-10 w-10 text-oc-ink/40" strokeWidth={1.5} aria-hidden="true" />
        </div>
      </Link>

      <div className="mt-3.5 flex items-start justify-between gap-2">
        <Link href={`/campaigns/${campaign.slug}`}>
          <h3 className="font-display text-base font-bold leading-snug text-oc-ink line-clamp-2">{campaign.title}</h3>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <CampaignStatusBadge status={campaign.status} />
          {campaign.categoryName && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-oc-ink">{campaign.categoryName}</span>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-xs text-oc-ink-muted">
        <Avatar name={campaign.brandName} url={campaign.brandLogoUrl} size={16} />
        <span>{campaign.brandName}</span>
        <VerificationBadge status={campaign.brandVerification} />
        <span aria-hidden="true">&middot;</span>
        <span>{campaign.applicantCount ?? 0} applicants</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-oc-ink-muted/80">
        <span className={`flex items-center gap-1 ${slotsRemaining <= 0 ? "font-medium text-red-600" : ""}`}>
          <Users className="h-3 w-3" aria-hidden="true" />
          {slotsRemaining <= 0 ? "Fully booked" : `${slotsRemaining} of ${campaign.creatorCountNeeded} slots`}
        </span>
        {meta && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {meta}
          </span>
        )}
        {urgency && (
          <span className="flex items-center gap-1 font-medium text-oc-700">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {urgency}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-oc-ink-muted">Budget</p>
          <p className="font-display text-lg font-extrabold text-oc-ink">{budgetLabel(campaign)}</p>
        </div>
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="inline-flex items-center gap-1 rounded-full bg-oc-dark px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          View <span aria-hidden="true">&raquo;</span>
        </Link>
      </div>
    </div>
  );
}
