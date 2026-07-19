import Link from "next/link";
import { Avatar, BudgetPill, CampaignStatusBadge, CategoryChip, VerificationBadge, formatIDR } from "./primitives";

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
}

function budgetLabel(c: CampaignCardData): string {
  if (c.budgetType === "barter") return "Product Barter";
  if (c.budgetType === "affiliate") return "Affiliate Commission";
  if (c.budgetType === "negotiable") return "Negotiable";
  if (c.budgetPerCreator) return `${formatIDR(c.budgetPerCreator)} / creator`;
  if (c.budgetMin && c.budgetMax) return `${formatIDR(c.budgetMin)}–${formatIDR(c.budgetMax)}`;
  return "Negotiable";
}

function isClosingSoon(deadline: Date | string | null): boolean {
  if (!deadline) return false;
  const days = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 5;
}

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const slotsRemaining = Math.max(0, campaign.creatorCountNeeded - campaign.creatorCountAccepted);

  return (
    <div className="flex flex-col rounded-oc border border-oc-border bg-oc-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        <Avatar name={campaign.brandName} url={campaign.brandLogoUrl} size={28} />
        <span className="text-sm font-medium text-oc-ink">{campaign.brandName}</span>
        <VerificationBadge status={campaign.brandVerification} />
      </div>

      <Link href={`/campaigns/${campaign.slug}`} className="mt-3 block">
        <h3 className="text-base font-semibold text-oc-ink line-clamp-2">{campaign.title}</h3>
      </Link>
      <p className="mt-1 text-sm text-oc-ink-muted line-clamp-2">{campaign.shortDescription}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {campaign.categoryName && <CategoryChip>{campaign.categoryName}</CategoryChip>}
        <CategoryChip>{campaign.isRemote ? "Remote" : campaign.city ?? "On-site"}</CategoryChip>
        {isClosingSoon(campaign.applicationDeadline) && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Closing Soon
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <BudgetPill text={budgetLabel(campaign)} />
        <span className="text-xs text-oc-ink-muted">{slotsRemaining} of {campaign.creatorCountNeeded} slots left</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-oc-border pt-4">
        <CampaignStatusBadge status={campaign.status} />
        <Link href={`/campaigns/${campaign.slug}`} className="text-sm font-medium text-oc-700 hover:underline">
          View Campaign →
        </Link>
      </div>
    </div>
  );
}
