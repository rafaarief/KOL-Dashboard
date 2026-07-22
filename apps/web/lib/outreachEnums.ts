/** Shared enums for the Outreach CRM (KOL Outreach / Brand Outreach modules) — reused by both
 * API route validation and client-side selects/badges so the two never drift apart. */

export const OUTREACH_SOURCES = ["instagram", "tiktok", "threads", "referral", "community", "other"] as const;
export type OutreachSource = (typeof OUTREACH_SOURCES)[number];

export const OUTREACH_SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  referral: "Referral",
  community: "Community",
  other: "Other",
};

export const KOL_OUTREACH_STATUSES = [
  "new",
  "contacted",
  "no_reply",
  "replied",
  "follow_up_1",
  "follow_up_2",
  "interested",
  "accepted",
  "rejected",
  "profile_completed",
  "converted",
] as const;
export type KolOutreachStatus = (typeof KOL_OUTREACH_STATUSES)[number];

export const BRAND_OUTREACH_STATUSES = [
  "new",
  "contacted",
  "no_reply",
  "replied",
  "follow_up_1",
  "follow_up_2",
  "interested",
  "accepted",
  "rejected",
  "campaign_requested",
  "converted",
] as const;
export type BrandOutreachStatus = (typeof BRAND_OUTREACH_STATUSES)[number];

export const OUTREACH_STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  no_reply: "No Reply",
  replied: "Replied",
  follow_up_1: "Follow Up 1",
  follow_up_2: "Follow Up 2",
  interested: "Interested",
  accepted: "Accepted",
  rejected: "Rejected",
  profile_completed: "Profile Completed",
  campaign_requested: "Campaign Requested",
  converted: "Converted",
};

// Grey / Blue / Orange / Green / Red status groups.
export const OUTREACH_STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  new: "neutral",
  contacted: "info",
  no_reply: "info",
  replied: "info",
  follow_up_1: "warning",
  follow_up_2: "warning",
  interested: "success",
  accepted: "success",
  profile_completed: "success",
  campaign_requested: "success",
  converted: "success",
  rejected: "danger",
};
