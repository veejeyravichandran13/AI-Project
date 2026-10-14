import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-xl", className)} />;
}

export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <LoadingRegion label="Finding your five best-fitting cars…">
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid gap-6 rounded-3xl border border-line bg-surface p-4 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-6 h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function DetailSkeleton() {
  return (
    <LoadingRegion label="Loading vehicle details…">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/3" />
      <Skeleton className="mt-8 aspect-[16/8] w-full rounded-3xl" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </LoadingRegion>
  );
}

export function TableSkeleton() {
  return (
    <LoadingRegion label="Loading comparison…">
      <div className="rounded-3xl border border-line bg-surface p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-8 w-full last:mb-0" />
        ))}
      </div>
    </LoadingRegion>
  );
}
