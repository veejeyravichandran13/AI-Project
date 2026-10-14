"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Plus, X } from "@phosphor-icons/react";
import type { BreakEven } from "@/types/ownership";
import { useAppStore } from "@/store/use-app-store";
import { useAssumptions, usePicks } from "@/lib/hooks";
import { useCatalogue, useOwnershipComparison } from "@/lib/queries";
import { carName, getOption } from "@/lib/catalogue";
import { formatInr, formatPriceCompact, formatYears } from "@/lib/formatters";
import { MAX_COMPARE } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/section";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Skeleton } from "@/components/feedback/loading-skeleton";
import { AssumptionEditor } from "@/components/ownership/assumption-editor";
import { OwnershipCostCard } from "@/components/ownership/ownership-cost-card";
import { CostComparisonChart, CumulativeCostChart, type ChartSeries } from "@/components/ownership/cost-charts";
import { ComparisonPicker } from "@/components/comparison/comparison-picker";
import { CarPhoto } from "@/components/cars/car-photo";
import { toast } from "@/store/use-toast-store";

function BreakEvenList({ items, nameOf }: { items: BreakEven[]; nameOf: (id: string) => string }) {
  const reached = items.filter((b) => b.reachedWithinHorizon);
  const rest = items.filter((b) => !b.reachedWithinHorizon);
  return (
    <ul className="mt-3 space-y-3">
      {reached.map((b) => (
        <li key={`${b.premiumCarId}-${b.baselineCarId}`} className="rounded-2xl bg-surface-2 p-4 text-sm leading-6"><p className="font-medium">{nameOf(b.premiumCarId)} vs {nameOf(b.baselineCarId)}</p><p className="mt-1">{b.statement}</p></li>
      ))}
      {rest.length > 0 ? (
        <li className="rounded-2xl bg-surface-2 p-4 text-sm leading-6"><p className="font-medium">No break-even found</p><ul className="mt-1 list-disc space-y-1 pl-5">{rest.map((b) => <li key={`${b.premiumCarId}-${b.baselineCarId}`}>{b.statement}</li>)}</ul></li>
      ) : null}
    </ul>
  );
}

export function CostLabView() {
  const hydrated = useAppStore((s) => s.hydrated);
  const ids = useAppStore((s) => s.compareIds);
  const remove = useAppStore((s) => s.removeFromCompare);
  const setOption = useAppStore((s) => s.setOption);
  const assumptions = useAssumptions();
  const [pickerOpen, setPickerOpen] = useState(false);

  const catalogue = useCatalogue();
  const picks = usePicks(ids, catalogue.data?.models);
  const result = useOwnershipComparison(picks, assumptions);
  useEffect(() => track({ name: "cost_lab_viewed" }), []);

  const series: ChartSeries[] = useMemo(() => {
    if (!result.data || !catalogue.data) return [];
    return result.data.estimates.flatMap((e) => {
      const c = catalogue.data.models.find((x) => x.id === e.carId);
      return c ? [{ id: `${e.carId}:${e.optionId}`, name: `${carName(c)} · ${getOption(c, e.optionId).label}`, estimate: e }] : [];
    });
  }, [result.data, catalogue.data]);

  if (!hydrated) return <Skeleton className="h-96" />;

  const complete = series.filter((s) => s.estimate.completeness === "full" && s.estimate.totalCost !== null).sort((a, b) => (a.estimate.totalCost ?? 0) - (b.estimate.totalCost ?? 0));
  const incomplete = series.filter((s) => s.estimate.completeness !== "full");
  const nameOf = (carId: string) => series.find((s) => s.estimate.carId === carId)?.name ?? carId;

  return (
    <>
      <PageHeader eyebrow="Ownership cost lab" title="What could it really cost to own?" description="Estimates for the cars in your comparison, on one shared set of assumptions you can inspect and change. Efficiency comes from each car’s claimed figure; fuel prices and servicing are editable samples." actions={<Button onClick={() => setPickerOpen(true)} disabled={ids.length >= MAX_COMPARE}><Plus size={18} weight="bold" /> Add cars</Button>} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1"><AssumptionEditor /></div>
        <div className="order-1 space-y-6 lg:order-2">
          {ids.length === 0 ? (
            <EmptyState icon={<Calculator size={28} weight="duotone" />} title="Add cars to estimate their costs" message="Cost Lab uses the same cars as your comparison, so everything stays consistent. Add two or more to see how running costs and total cost differ." action={<Button onClick={() => setPickerOpen(true)}><Plus size={18} weight="bold" /> Add cars</Button>} />
          ) : (
            <>
              <ul className="space-y-2" aria-label="Cars being costed">
                {ids.map((id) => {
                  const c = catalogue.data?.models.find((x) => x.id === id);
                  const pick = picks.find((p) => p.carId === id);
                  if (!c) return <li key={id}><Skeleton className="h-16" /></li>;
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
                      <CarPhoto car={c} className="h-14 w-24 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{carName(c)}</p>
                        <label htmlFor={`cl-v-${id}`} className="sr-only">Engine option for {carName(c)}</label>
                        <select id={`cl-v-${id}`} value={pick?.optionId} onChange={(e) => setOption(id, e.target.value)} className="mt-1 min-h-10 w-full max-w-sm rounded-xl border border-line bg-surface px-2 text-sm">
                          {c.options.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                        </select>
                      </div>
                      <button type="button" aria-label={`Remove ${carName(c)}`} onClick={() => { remove(id); toast(`${carName(c)} removed`); }} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"><X size={18} /></button>
                    </li>
                  );
                })}
              </ul>

              {result.isPending || catalogue.isPending ? (
                <div role="status" aria-busy="true" className="space-y-4"><span className="sr-only">Calculating estimates…</span><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
              ) : result.isError ? (
                <ErrorState title="Could not calculate estimates" message={result.error.message} onRetry={() => void result.refetch()} busy={result.isFetching} />
              ) : (
                <div className={result.isFetching ? "space-y-6 opacity-60 transition-opacity" : "space-y-6 transition-opacity"} aria-busy={result.isFetching}>
                  <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
                    <h2 className="font-display text-xl font-semibold">The short version</h2>
                    {complete.length >= 2 ? (
                      <ul className="mt-3 space-y-2 text-[15px] leading-7">
                        <li><strong>{complete[0].name}</strong> has the lowest estimated total over {formatYears(assumptions.years)}: {formatPriceCompact(complete[0].estimate.totalCost ?? 0)}.</li>
                        {complete.slice(1).map((s) => <li key={s.id}>{s.name} would cost about <strong>{formatInr((s.estimate.totalCost ?? 0) - (complete[0].estimate.totalCost ?? 0))}</strong> more in total.</li>)}
                      </ul>
                    ) : <p className="mt-3 text-[15px] leading-7 text-muted">{series.length < 2 ? "Add a second car to see how totals differ." : "Not enough complete estimates to compare totals fairly."}</p>}
                    {incomplete.length > 0 ? <p role="status" className="mt-3 rounded-2xl bg-warn-soft p-3 text-sm leading-6">{incomplete.map((s) => s.name).join(", ")}: missing inputs ({[...new Set(incomplete.flatMap((s) => s.estimate.missing))].join(", ").toLowerCase()}), so left out of the comparison above.</p> : null}
                    <p className="mt-3 text-xs leading-5 text-muted">All purchase prices use the same basis ({assumptions.priceBasis === "on-road" ? `indicative on-road, ex-showroom + ${assumptions.onRoadLoadingPct}% sample loading` : "ex-showroom"}). Where an engine’s own price is unpublished, the model’s starting price is used and flagged. Resale, insurance, financing and tyres are excluded.</p>
                  </div>
                  <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><CostComparisonChart series={series} years={assumptions.years} /></div>
                  <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><CumulativeCostChart series={series} years={assumptions.years} /></div>
                  <section aria-labelledby="be-h" className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-2"><h2 id="be-h" className="font-display text-xl font-semibold">Break-even check</h2><Badge tone="accent">Estimate</Badge></div>
                    {result.data.breakEvens.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted">A break-even only makes sense between two cars on the same price basis where one costs more to buy but less to run. Add another car to check.</p> : <BreakEvenList items={result.data.breakEvens} nameOf={nameOf} />}
                  </section>
                  <div className="grid gap-5 xl:grid-cols-2">{series.map((s) => <OwnershipCostCard key={s.id} title={s.name} estimate={s.estimate} assumptions={assumptions} />)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ComparisonPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
