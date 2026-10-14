"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, MagnifyingGlass, Plus, Printer, Scales, Trash } from "@phosphor-icons/react";
import { useAppStore } from "@/store/use-app-store";
import { useAssumptions, usePicks } from "@/lib/hooks";
import { useCatalogue, useComparisonData, useRecommendations } from "@/lib/queries";
import { MAX_COMPARE } from "@/lib/constants";
import { findState } from "@/data/locations";
import { carName } from "@/lib/catalogue";
import { formatKm, formatYears } from "@/lib/formatters";
import { SAMPLE_REQUIREMENTS } from "@/data/discovery-options";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/section";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Skeleton, TableSkeleton } from "@/components/feedback/loading-skeleton";
import { ComparisonPicker } from "@/components/comparison/comparison-picker";
import { ComparisonTable } from "@/components/comparison/comparison-table";
import { ComparisonLimitNotice } from "@/components/comparison/comparison-limit-notice";
import { RadarChart } from "@/components/comparison/radar-chart";
import { toast } from "@/store/use-toast-store";
import { cn } from "@/lib/utils/cn";

type Mode = "mine" | "choose";

export function CompareView() {
  const hydrated = useAppStore((s) => s.hydrated);
  const ids = useAppStore((s) => s.compareIds);
  const requirements = useAppStore((s) => s.submitted);
  const clear = useAppStore((s) => s.clearCompare);
  const addMany = useAppStore((s) => s.addManyToCompare);
  const submit = useAppStore((s) => s.submitRequirements);
  const assumptions = useAssumptions();

  const [mode, setMode] = useState<Mode>("choose");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [showMeaning, setShowMeaning] = useState(true);
  const [diffOnly, setDiffOnly] = useState(false);

  const catalogue = useCatalogue();
  const picks = usePicks(ids, catalogue.data?.models);
  const data = useComparisonData(picks, assumptions, requirements);
  const recs = useRecommendations(mode === "mine" ? requirements : null);

  if (!hydrated) return <Skeleton className="h-96" />;

  const openPicker = (replace: string | null = null) => { setReplaceId(replace); setPickerOpen(true); };
  const state = assumptions.stateCode ? findState(assumptions.stateCode)?.name : undefined;
  const loadRecs = () => {
    if (!recs.data) return;
    clear();
    const { added } = addMany(recs.data.matches.map((m) => m.carId));
    toast(`Loaded your top ${added} matches`, "success");
  };

  return (
    <>
      <PageHeader
        eyebrow="Compare cars"
        title="Side by side, on the same assumptions"
        description={`Compare up to ${MAX_COMPARE} cars: your recommendations, or any cars you choose. Costs use one shared set of assumptions so differences are fair.`}
        actions={
          <>
            <Button onClick={() => openPicker()} disabled={ids.length >= MAX_COMPARE}><Plus size={18} weight="bold" /> Add cars</Button>
            {ids.length > 0 ? (<><Button variant="secondary" onClick={() => window.print()}><Printer size={18} /> Print</Button><Button variant="ghost" onClick={() => { clear(); toast("Comparison cleared"); }}><Trash size={18} /> Clear</Button></>) : null}
          </>
        }
      />

      <div role="tablist" aria-label="How to choose cars" className="mb-6 inline-flex rounded-full border border-line bg-surface p-1 no-print">
        {([{ id: "mine", label: "Compare my recommendations", icon: ListChecks }, { id: "choose", label: "Choose cars to compare", icon: MagnifyingGlass }] as const).map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={mode === t.id} aria-controls="mode-panel" tabIndex={mode === t.id ? 0 : -1} onClick={() => setMode(t.id)} onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") setMode(mode === "mine" ? "choose" : "mine"); }} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors", mode === t.id ? "bg-ink text-bg" : "text-muted hover:text-ink")}>
            <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.id === "mine" ? "My matches" : "Choose cars"}</span>
          </button>
        ))}
      </div>

      <div id="mode-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="mb-8 no-print">
        {mode === "mine" ? (
          !requirements ? (
            <div className="rounded-3xl border border-line bg-surface p-5">
              <p className="font-medium">No recommendations yet</p>
              <p className="mt-1 text-sm text-muted">Share your brief first, or try a sample, and your top five will load here.</p>
              <div className="mt-4 flex flex-wrap gap-3"><Button href="/discover">Find My Car</Button><Button variant="secondary" onClick={() => submit(SAMPLE_REQUIREMENTS)}>Use a sample brief</Button></div>
            </div>
          ) : recs.isPending ? <Skeleton className="h-20" /> : recs.isError ? (
            <ErrorState title="Could not load your recommendations" message={recs.error.message} onRetry={() => void recs.refetch()} busy={recs.isFetching} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-5">
              <p className="max-w-xl text-sm leading-6">Load your {recs.data.matches.length} recommended {recs.data.matches.length === 1 ? "car" : "cars"} into the table. This replaces your current selection.</p>
              <Button onClick={loadRecs} disabled={recs.data.matches.length === 0}><Scales size={18} /> Load my top {recs.data.matches.length || "five"}</Button>
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-5">
            <p className="max-w-xl text-sm leading-6">Search the whole catalogue by manufacturer, body style, fuel or price, including cars that were not recommended to you.</p>
            <Button variant="secondary" onClick={() => openPicker()} disabled={ids.length >= MAX_COMPARE}><MagnifyingGlass size={18} /> Browse catalogue</Button>
          </div>
        )}
      </div>

      <ComparisonLimitNotice count={ids.length} />

      {ids.length === 0 ? (
        <EmptyState icon={<Scales size={28} weight="duotone" />} title="Pick cars to compare" message={`Add two to ${MAX_COMPARE} cars to see specifications, trade-offs and running costs side by side.`} action={<Button onClick={() => openPicker()}><Plus size={18} weight="bold" /> Add cars</Button>} />
      ) : (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-2 p-4 text-sm leading-6">
            <p>
              <strong>Same assumptions for every car:</strong> {formatKm(assumptions.annualKm)} a year · {formatYears(assumptions.years)} · {state ?? "India-wide sample prices"} · {assumptions.priceBasis === "on-road" ? "indicative on-road" : "ex-showroom"} price basis.{" "}
              <Link href="/ownership" className="font-medium text-accent underline underline-offset-2">Edit in Cost Lab</Link>
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 no-print">
              {requirements ? <label className="inline-flex min-h-10 cursor-pointer items-center gap-2"><input type="checkbox" checked={showMeaning} onChange={(e) => setShowMeaning(e.target.checked)} className="size-4 accent-[var(--accent)]" /> Show what rows mean for me</label> : null}
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2"><input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="size-4 accent-[var(--accent)]" /> Differences only</label>
            </div>
          </div>
          {ids.length === 1 ? <p className="text-sm text-muted">Add at least one more car to compare. Best-in-row highlights need two or more.</p> : null}

          {data.isPending || catalogue.isPending ? <TableSkeleton /> : data.isError ? (
            <ErrorState title="Could not build the comparison" message={data.error.message} onRetry={() => void data.refetch()} busy={data.isFetching} />
          ) : (
            <div className={cn("space-y-8 transition-opacity", data.isFetching && "opacity-60")} aria-busy={data.isFetching}>
              {data.data.items.length >= 2 ? (
                <section aria-labelledby="radar-h" className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
                  <h2 id="radar-h" className="mb-1 font-display text-2xl font-semibold">Shape of each car</h2>
                  <p className="mb-5 text-sm text-muted">Five dimensions computed from published figures. A bigger shape is stronger overall, but what matters is the axis you care about.</p>
                  <RadarChart series={data.data.items.map((i) => ({ id: i.car.id, name: carName(i.car), metrics: i.metrics }))} />
                </section>
              ) : null}
              <ComparisonTable data={data.data} requirements={requirements} showMeaning={showMeaning} differencesOnly={diffOnly} onReplace={(id) => openPicker(id)} />
            </div>
          )}
          <p className="text-xs leading-5 text-muted">Highlights appear only when every car has a comparable value. “Not available” means no source we found publishes it; “Not applicable” means the feature does not exist for that fuel type. Each “src” links to where the value came from.</p>
        </div>
      )}
      <ComparisonPicker open={pickerOpen} onOpenChange={setPickerOpen} replaceId={replaceId} />
    </>
  );
}
