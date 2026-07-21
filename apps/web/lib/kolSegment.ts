import { sql } from "drizzle-orm";

export const KOL_SEGMENTS = ["nano", "mikro", "makro", "mega"] as const;
export type KolSegment = (typeof KOL_SEGMENTS)[number];

export const KOL_SEGMENT_LABELS: Record<KolSegment, string> = {
  nano: "Nano KOL",
  mikro: "Mikro KOL",
  makro: "Makro KOL",
  mega: "Mega KOL",
};

// Thresholds are the segment's follower floor — a KOL qualifies for a segment once their
// single strongest platform (Instagram or TikTok, never summed) reaches it.
export const KOL_SEGMENT_THRESHOLDS: Record<KolSegment, number> = {
  nano: 0,
  mikro: 10_000,
  makro: 100_000,
  mega: 1_000_000,
};

/** Per-platform follower subqueries — used both to classify a KOL's segment and to show the
 * per-platform breakdown. Segment is derived from whichever platform is stronger (the "upper
 * limit"), never the sum of both, since a KOL's real reach/rate-card leverage tracks their
 * biggest single audience, not a combined headcount that double-counts the same people. */
export const igFollowersSql = sql<number>`(
  select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa
  inner join platforms p on p.id = csa.platform_id
  where csa.creator_profile_id = creator_profiles.id and p.slug = 'instagram'
)`;

export const tiktokFollowersSql = sql<number>`(
  select coalesce(sum(csa.follower_count), 0) from creator_social_accounts csa
  inner join platforms p on p.id = csa.platform_id
  where csa.creator_profile_id = creator_profiles.id and p.slug = 'tiktok'
)`;

export const kolSegmentDriverSql = sql<number>`greatest(${igFollowersSql}, ${tiktokFollowersSql})`;

export const kolSegmentSql = sql<KolSegment>`(
  case
    when ${kolSegmentDriverSql} >= ${KOL_SEGMENT_THRESHOLDS.mega} then 'mega'
    when ${kolSegmentDriverSql} >= ${KOL_SEGMENT_THRESHOLDS.makro} then 'makro'
    when ${kolSegmentDriverSql} >= ${KOL_SEGMENT_THRESHOLDS.mikro} then 'mikro'
    else 'nano'
  end
)`;

export function kolSegmentFromCount(followerCount: number): KolSegment {
  if (followerCount >= KOL_SEGMENT_THRESHOLDS.mega) return "mega";
  if (followerCount >= KOL_SEGMENT_THRESHOLDS.makro) return "makro";
  if (followerCount >= KOL_SEGMENT_THRESHOLDS.mikro) return "mikro";
  return "nano";
}
