import Link from "next/link";
import type { ReactNode } from "react";

// The 7 flat pastel fills from the design handoff spec — cards rotate through these in order
// so no two adjacent cards in a row share a color (never more than one per row repeats).
const PASTELS = ["blush", "lime", "mustard", "lavender", "sky", "green", "salmon"] as const;

/** Picks a pastel tile by position in a list (grid card rows) — sequential, so adjacent cards
 * never repeat a color within a single row. */
export function tileAt(index: number): string {
  return `bg-tile-${PASTELS[index % PASTELS.length]}`;
}

/** Deterministically picks a pastel tile from a name/id string — for single-instance contexts
 * (a profile header banner) where there's no row position to cycle against. */
export function tileForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return `bg-tile-${PASTELS[Math.abs(hash) % PASTELS.length]}`;
}

export function OcCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-oc border border-oc-border bg-oc-card shadow-oc-sm ${className}`}>{children}</div>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const BUTTON_VARIANTS = {
  primary: "bg-oc-600 text-white shadow-oc-sm hover:bg-oc-700",
  secondary: "border border-oc-ink/15 text-oc-ink bg-white hover:bg-oc-bg",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-oc-ink-muted hover:text-oc-ink hover:bg-oc-bg",
} as const;

export function OcButton({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_VARIANTS }) {
  return <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />;
}

export function OcLinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof BUTTON_VARIANTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

const BADGE_TONES = {
  neutral: "bg-oc-border/60 text-oc-ink-muted",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-oc-300/30 text-oc-700",
  danger: "bg-red-100 text-red-700",
} as const;

export function OcBadge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  if (status !== "verified") return null;
  return <OcBadge tone="purple">✓ Verified</OcBadge>;
}

const AVAILABILITY_LABELS: Record<string, { label: string; tone: keyof typeof BADGE_TONES }> = {
  open: { label: "Open for Collaboration", tone: "success" },
  limited: { label: "Limited Availability", tone: "warning" },
  fully_booked: { label: "Fully Booked", tone: "neutral" },
  unavailable: { label: "Temporarily Unavailable", tone: "danger" },
};

export function AvailabilityBadge({ status }: { status: string }) {
  const entry = AVAILABILITY_LABELS[status] ?? AVAILABILITY_LABELS.open;
  return <OcBadge tone={entry.tone}>{entry.label}</OcBadge>;
}

const APPLICATION_STATUS_LABELS: Record<string, { label: string; tone: keyof typeof BADGE_TONES }> = {
  submitted: { label: "Submitted", tone: "info" },
  viewed: { label: "Viewed", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "purple" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  const entry = APPLICATION_STATUS_LABELS[status] ?? APPLICATION_STATUS_LABELS.submitted;
  return <OcBadge tone={entry.tone}>{entry.label}</OcBadge>;
}

const CAMPAIGN_STATUS_LABELS: Record<string, { label: string; tone: keyof typeof BADGE_TONES }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "Pending Review", tone: "warning" },
  published: { label: "Published", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  filled: { label: "Filled", tone: "info" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function CampaignStatusBadge({ status }: { status: string }) {
  const entry = CAMPAIGN_STATUS_LABELS[status] ?? CAMPAIGN_STATUS_LABELS.draft;
  return <OcBadge tone={entry.tone}>{entry.label}</OcBadge>;
}

export function BudgetPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-oc-bg px-3 py-1 text-xs font-semibold text-oc-700">
      {text}
    </span>
  );
}

export function CategoryChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-oc-border px-2.5 py-0.5 text-xs text-oc-ink-muted">
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-oc border border-dashed border-oc-border bg-oc-bg px-6 py-12 text-center">
      <p className="text-sm font-medium text-oc-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-oc-ink-muted">{description}</p>}
    </div>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-oc-300/40 font-semibold text-oc-700"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </div>
  );
}

export function formatIDR(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Negotiable";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(num)) return "Negotiable";
  return `Rp${num.toLocaleString("id-ID")}`;
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-oc-ink-muted">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrevious}
          className="rounded-oc-input border border-oc-border px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="rounded-oc-input border border-oc-border px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
