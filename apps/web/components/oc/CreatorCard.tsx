import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvailabilityBadge, CategoryChip, VerificationBadge, formatCompactNumber, formatIDR, tileAt } from "./primitives";
import { KOL_SEGMENT_LABELS, type KolSegment } from "@/lib/kolSegment";

const RECENTLY_ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatorCardData {
  username: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
  primaryNicheName: string | null;
  availabilityStatus: string;
  verificationStatus: string;
  minimumBudget: string | null;
  acceptsBarter?: boolean;
  totalFollowers: number;
  kolSegment?: KolSegment;
  slotsRemaining: number | null;
  monthlyCapacity: number | null;
  featured?: boolean;
  lastLoginAt?: Date | string | null;
}

export function CreatorCard({ creator, index = 0 }: { creator: CreatorCardData; index?: number }) {
  const isRecentlyActive = creator.lastLoginAt ? Date.now() - new Date(creator.lastLoginAt).getTime() < RECENTLY_ACTIVE_WINDOW_MS : false;

  return (
    <div className={`group relative flex flex-col items-center rounded-oc p-5 text-center transition duration-200 hover:-translate-y-1 hover:shadow-oc ${tileAt(index)}`}>
      {creator.featured && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center rounded-full bg-oc-dark px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          ★ Featured
        </span>
      )}
      <div className="rounded-full ring-4 ring-white transition duration-200 group-hover:scale-105">
        <Avatar name={creator.displayName} url={creator.avatarUrl} size={64} />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <Link href={`/creators/${creator.username}`} className="font-display text-sm font-bold text-oc-ink hover:underline">
          {creator.displayName}
        </Link>
        <VerificationBadge status={creator.verificationStatus} />
      </div>
      <p className="flex items-center justify-center gap-1 text-xs text-oc-ink-muted">
        @{creator.username}
        {creator.city && (
          <>
            <span aria-hidden="true">·</span>
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {creator.city}
          </>
        )}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {creator.kolSegment && (
          <span className="inline-flex items-center rounded-full bg-oc-dark px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {KOL_SEGMENT_LABELS[creator.kolSegment]}
          </span>
        )}
        {creator.primaryNicheName && <CategoryChip>{creator.primaryNicheName}</CategoryChip>}
        {isRecentlyActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-oc-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-oc-600" /> Active
          </span>
        )}
        {creator.acceptsBarter && (
          <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-oc-ink">
            Open for Barter
          </span>
        )}
      </div>

      <div className="mt-3 grid w-full grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-white px-2 py-2">
          <p className="font-display font-bold text-oc-ink">{formatCompactNumber(creator.totalFollowers)}</p>
          <p className="text-oc-ink-muted">Followers</p>
        </div>
        <div className="rounded-2xl bg-white px-2 py-2">
          <p className="font-display font-bold text-oc-ink">
            {creator.minimumBudget ? formatIDR(creator.minimumBudget) : creator.acceptsBarter ? "Barter" : "Contact"}
          </p>
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
        className="mt-4 w-full rounded-full bg-oc-dark py-2 text-sm font-semibold text-white hover:bg-black"
      >
        View Profile
      </Link>
    </div>
  );
}
