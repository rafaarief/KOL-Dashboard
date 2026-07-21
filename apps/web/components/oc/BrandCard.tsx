import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import { Avatar, VerificationBadge, tileAt } from "./primitives";

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

export function BrandCard({ brand, index = 0 }: { brand: BrandCardData; index?: number }) {
  return (
    <div className={`group relative flex flex-col items-center rounded-oc p-5 text-center transition duration-200 hover:-translate-y-1 hover:shadow-oc ${tileAt(index)}`}>
      {brand.featured && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center rounded-full bg-oc-dark px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          ★ Featured
        </span>
      )}
      <div className="rounded-full ring-4 ring-white transition duration-200 group-hover:scale-105">
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
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-oc-ink">
          <Zap className="h-2.5 w-2.5" aria-hidden="true" /> Responds Quickly
        </span>
      )}
      <p className="mt-3 text-xs text-oc-ink-muted">{brand.activeCampaignCount} active campaign(s)</p>
      <Link
        href={`/brands/${brand.slug}`}
        className="mt-4 w-full rounded-full bg-oc-dark py-2 text-sm font-semibold text-white hover:bg-black"
      >
        View Brand
      </Link>
    </div>
  );
}
