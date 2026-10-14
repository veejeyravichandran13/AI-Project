import { Star } from "@phosphor-icons/react/dist/ssr";
import type { Car } from "@/types/car";
import { cn } from "@/lib/utils/cn";

export function Stars({ n, max = 5, size = 14, className }: { n: number; max?: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${n} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} weight={i < n ? "fill" : "regular"} className={i < n ? "text-warn" : "text-muted/60"} />
      ))}
    </span>
  );
}

/** Compact safety badge: real rating with its body and year, or an explicit "not rated". */
export function NcapBadge({ car, compact }: { car: Car; compact?: boolean }) {
  const n = car.safety.ncap;
  if (!n) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-muted">No NCAP rating found</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Stars n={n.stars} size={compact ? 12 : 14} />
      {compact ? <span className="text-muted">{n.body.replace(" NCAP", "")}</span> : <span className="text-muted">{n.body}{n.year ? ` · ${n.year}` : ""}</span>}
    </span>
  );
}
