import Link from "next/link";
import { Avatar, AvailabilityBadge, CategoryChip, VerificationBadge, formatCompactNumber, formatIDR } from "./primitives";

export interface CreatorCardData {
  username: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
  primaryNicheName: string | null;
  availabilityStatus: string;
  verificationStatus: string;
  minimumBudget: string | null;
  totalFollowers: number;
  slotsRemaining: number | null;
  monthlyCapacity: number | null;
  featured?: boolean;
}

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  return (
    <div className="relative flex flex-col items-center rounded-oc border border-oc-border bg-oc-card p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {creator.featured && (
        <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-oc-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          ★ Featured
        </span>
      )}
      <Avatar name={creator.displayName} url={creator.avatarUrl} size={64} />
      <div className="mt-3 flex items-center gap-1.5">
        <Link href={`/creators/${creator.username}`} className="text-sm font-semibold text-oc-ink hover:underline">
          {creator.displayName}
        </Link>
        <VerificationBadge status={creator.verificationStatus} />
      </div>
      <p className="text-xs text-oc-ink-muted">@{creator.username}{creator.city ? ` · ${creator.city}` : ""}</p>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {creator.primaryNicheName && <CategoryChip>{creator.primaryNicheName}</CategoryChip>}
      </div>

      <div className="mt-3 grid w-full grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-oc-bg px-2 py-2">
          <p className="font-semibold text-oc-ink">{formatCompactNumber(creator.totalFollowers)}</p>
          <p className="text-oc-ink-muted">Followers</p>
        </div>
        <div className="rounded-lg bg-oc-bg px-2 py-2">
          <p className="font-semibold text-oc-ink">{creator.minimumBudget ? formatIDR(creator.minimumBudget) : "Contact"}</p>
          <p className="text-oc-ink-muted">Starting rate</p>
        </div>
      </div>

      <div className="mt-3">
        <AvailabilityBadge status={creator.availabilityStatus} />
      </div>
      {creator.slotsRemaining !== null && creator.monthlyCapacity && (
        <p className="mt-1 text-xs text-oc-ink-muted">
          {creator.slotsRemaining} of {creator.monthlyCapacity} slots remaining
        </p>
      )}

      <Link
        href={`/creators/${creator.username}`}
        className="mt-4 w-full rounded-oc-input border border-oc-600 py-2 text-sm font-medium text-oc-600 hover:bg-oc-300/10"
      >
        View Profile
      </Link>
    </div>
  );
}
