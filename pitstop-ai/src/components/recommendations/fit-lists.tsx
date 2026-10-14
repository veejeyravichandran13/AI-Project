import { CheckCircle, Warning, ThumbsUp, ThumbsDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

/** `collapsedAfter` hides later items on small screens only; they stay visible from md upward. */
export function FitReasonList({ reasons, className, collapsedAfter }: { reasons: string[]; className?: string; collapsedAfter?: number }) {
  return (
    <section aria-label="Five reasons this car may fit" className={className}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Why it may fit</h4>
      <ol className="space-y-2.5">
        {reasons.map((r, i) => (
          <li key={i} className={cn("flex gap-3 text-[15px] leading-6", collapsedAfter !== undefined && i >= collapsedAfter && "hidden md:flex")}>
            <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
            <span><span className="sr-only">Reason {i + 1}: </span>{r}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TradeoffPanel({ drawbacks, className }: { drawbacks: string[]; className?: string }) {
  return (
    <section aria-label="Trade-offs to weigh" className={cn("rounded-2xl bg-warn-soft p-4", className)}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-warn">Trade-offs to weigh</h4>
      <ul className="space-y-2">
        {drawbacks.map((d, i) => (
          <li key={i} className="flex gap-3 text-sm leading-6">
            <Warning size={18} weight="fill" className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SuitabilitySummary({ worksWellFor, mayNotWorkFor, className }: { worksWellFor: string[]; mayNotWorkFor: string[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <section aria-label="Works well for">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ThumbsUp size={18} weight="fill" className="text-good" /> Works well for</h4>
        <ul className="space-y-1.5 text-sm leading-6 text-muted">
          {worksWellFor.map((w) => <li key={w} className="flex gap-2"><span aria-hidden="true">•</span>{w}</li>)}
        </ul>
      </section>
      <section aria-label="May not work for">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ThumbsDown size={18} weight="fill" className="text-warn" /> May not work for</h4>
        <ul className="space-y-1.5 text-sm leading-6 text-muted">
          {mayNotWorkFor.map((w) => <li key={w} className="flex gap-2"><span aria-hidden="true">•</span>{w}</li>)}
        </ul>
      </section>
    </div>
  );
}
