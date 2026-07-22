import { OcCard } from "@/components/oc/primitives";

/** Covers every route under /admin/outreach (dashboard, kols, brands, [id] details, onboarding
 * wizards) — Next.js applies the nearest ancestor loading.tsx as a Suspense boundary during
 * navigation, so this shows instantly instead of a blank page while the client component
 * mounts and its first fetch resolves. */
export default function OutreachLoading() {
  return (
    <div>
      <div className="h-6 w-48 animate-pulse rounded bg-oc-border/60" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-oc-border/40" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <OcCard key={i} className="px-4 py-3">
            <div className="h-3 w-20 animate-pulse rounded bg-oc-border/60" />
            <div className="mt-2 h-6 w-12 animate-pulse rounded bg-oc-border/40" />
          </OcCard>
        ))}
      </div>
      <OcCard className="mt-4 p-5">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-oc-border/40" />
          ))}
        </div>
      </OcCard>
    </div>
  );
}
