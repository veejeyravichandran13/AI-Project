import type { OwnershipAssumptions, OwnershipEstimate } from "@/types/ownership";
import { formatInr, formatNumber, formatPriceCompact, formatYears } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Calculator, Warning } from "@phosphor-icons/react/dist/ssr";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0 ${strong ? "font-semibold" : ""}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tnum text-right">{value}</dd>
    </div>
  );
}

const NA = "Not enough information";

export function OwnershipCostCard({ estimate, assumptions, title }: { estimate: OwnershipEstimate; assumptions: OwnershipAssumptions; title?: string }) {
  const scope = estimate.acquisitionScope === "on-road" ? "on-road (estimate)" : "ex-showroom";
  const money = (v: number | null) => (v === null ? NA : formatInr(v));
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6" aria-label={title ?? "Ownership cost estimate"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">{title ?? "Ownership cost snapshot"}</h3>
        <Badge tone="accent" icon={<Calculator size={12} weight="fill" />}>Estimate</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{formatNumber(assumptions.annualKm, 0)} km a year for {formatYears(assumptions.years)} · {assumptions.stateCode ? `sample ${assumptions.stateCode} prices` : "India-wide sample prices"}</p>
      {estimate.completeness === "insufficient" ? (
        <p role="status" className="mt-4 rounded-2xl bg-warn-soft p-4 text-sm leading-6"><Warning size={16} weight="fill" className="mr-1 inline text-warn" />Not enough information to estimate: missing {estimate.missing.join(", ").toLowerCase()}.</p>
      ) : (
        <dl className="mt-3">
          <Row label={`Purchase price (${scope})`} value={money(estimate.acquisition)} />
          <Row label="Energy per year" value={money(estimate.annualEnergy)} />
          <Row label={`Energy over ${formatYears(assumptions.years)}`} value={money(estimate.cumulativeEnergy)} />
          <Row label="Servicing allowance per year" value={formatInr(estimate.annualMaintenance)} />
          <Row label={`Servicing over ${formatYears(assumptions.years)}`} value={formatInr(estimate.cumulativeMaintenance)} />
          <Row label="Estimated total" value={estimate.totalCost === null ? NA : formatPriceCompact(estimate.totalCost)} strong />
        </dl>
      )}
      {estimate.missing.length > 0 && estimate.completeness === "full" ? <p className="mt-3 text-sm text-warn"><Warning size={14} weight="fill" className="mr-1 inline" />{estimate.missing.join(". ")}.</p> : null}
      <p className="mt-3 text-xs leading-5 text-muted">Excludes insurance, financing, tyres, resale value, inflation and discounting. Efficiency is the claimed figure scaled to {Math.round(assumptions.realWorldFactor * 100)}% for real-world use. Fuel prices and the servicing allowance are editable generic assumptions, not model-specific data.</p>
    </section>
  );
}
