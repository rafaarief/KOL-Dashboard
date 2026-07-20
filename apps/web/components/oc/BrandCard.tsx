import Link from "next/link";
import { Avatar, VerificationBadge } from "./primitives";

export interface BrandCardData {
  slug: string;
  brandName: string;
  industry: string | null;
  city: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  activeCampaignCount: number;
  featured?: boolean;
}

export function BrandCard({ brand }: { brand: BrandCardData }) {
  return (
    <div className="relative flex flex-col items-center rounded-oc border border-oc-border bg-oc-card p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {brand.featured && (
        <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-oc-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          ★ Featured
        </span>
      )}
      <Avatar name={brand.brandName} url={brand.logoUrl} size={56} />
      <div className="mt-3 flex items-center gap-1.5">
        <Link href={`/brands/${brand.slug}`} className="text-sm font-semibold text-oc-ink hover:underline">
          {brand.brandName}
        </Link>
        <VerificationBadge status={brand.verificationStatus} />
      </div>
      <p className="text-xs text-oc-ink-muted">
        {brand.industry ?? "Brand"}
        {brand.city ? ` · ${brand.city}` : ""}
      </p>
      <p className="mt-3 text-xs text-oc-ink-muted">{brand.activeCampaignCount} active campaign(s)</p>
      <Link
        href={`/brands/${brand.slug}`}
        className="mt-4 w-full rounded-oc-input border border-oc-600 py-2 text-sm font-medium text-oc-600 hover:bg-oc-300/10"
      >
        View Brand
      </Link>
    </div>
  );
}
