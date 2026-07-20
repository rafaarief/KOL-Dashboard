import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
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
  respondsQuickly?: boolean;
}

export function BrandCard({ brand }: { brand: BrandCardData }) {
  return (
    <div className="group relative flex flex-col items-center rounded-oc border border-oc-border bg-oc-card p-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {brand.featured && (
        <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-oc-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          ★ Featured
        </span>
      )}
      <div className="transition duration-200 group-hover:scale-105">
        <Avatar name={brand.brandName} url={brand.logoUrl} size={56} />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <Link href={`/brands/${brand.slug}`} className="font-display text-sm font-bold text-oc-ink hover:underline">
          {brand.brandName}
        </Link>
        <VerificationBadge status={brand.verificationStatus} />
      </div>
      <p className="flex items-center justify-center gap-1 text-xs text-oc-ink-muted">
        {brand.industry ?? "Brand"}
        {brand.city && (
          <>
            <span aria-hidden="true">·</span>
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {brand.city}
          </>
        )}
      </p>
      {brand.respondsQuickly && (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          <Zap className="h-2.5 w-2.5" aria-hidden="true" /> Responds Quickly
        </span>
      )}
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
