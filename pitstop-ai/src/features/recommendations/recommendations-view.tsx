"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Funnel, PencilSimple, Scales } from "@phosphor-icons/react";
import type { Fuel } from "@/types/car";
import { useAppStore } from "@/store/use-app-store";
import { useCatalogue, useRecommendations } from "@/lib/queries";
import { useAssumptions } from "@/lib/hooks";
import { SAMPLE_REQUIREMENTS } from "@/data/discovery-options";
import { findState } from "@/data/locations";
import { estimateOwnership } from "@/lib/calculations/ownership";
import { buildMetricContext, metricsFor } from "@/lib/catalogue/metrics";
import { getOption, optionPriceRange, fuelFamily } from "@/lib/catalogue";
import { formatKm, formatLakh } from "@/lib/formatters";
import { summariseRequirements } from "@/lib/formatters/labels";
import { track } from "@/lib/analytics";
import { toast } from "@/store/use-toast-store";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/section";
import { SelectField } from "@/components/forms/select-field";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { RecommendationSkeleton, Skeleton } from "@/components/feedback/loading-skeleton";
import { MatchCard } from "@/components/recommendations/match-card";
import { MAX_COMPARE } from "@/lib/constants";

type SortKey = "fit" | "price-asc" | "price-desc" | "energy";
const SORTS = [
  { value: "fit" as SortKey, label: "Best fit for my brief" },
  { value: "price-asc" as SortKey, label: "Price: low to high" },
  { value: "price-desc" as SortKey, label: "Price: high to low" },
  { value: "energy" as SortKey, label: "Lowest yearly energy cost" },
];

export function RecommendationsView() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const requirements = useAppStore((s) => s.submitted);
  const submit = useAppStore((s) => s.submitRequirements);
  const setStep = useAppStore((s) => s.setDiscoveryStep);
  const addMany = useAppStore((s) => s.addManyToCompare);
  const assumptions = useAssumptions();
  const [fuel, setFuel] = useState<"all" | "petrol" | "diesel" | "cng" | "hybrid" | "ev">("all");
  const [sort, setSort] = useState<SortKey>("fit");

  const recs = useRecommendations(requirements);
  const catalogue = useCatalogue();
  const matchCount = recs.data?.matches.length;
  useEffect(() => {
    if (matchCount !== undefined) track({ name: "recommendations_viewed", count: matchCount });
  }, [matchCount]);

  const ctx = useMemo(() => (catalogue.data ? buildMetricContext(catalogue.data.models, assumptions) : null), [catalogue.data, assumptions]);

  const rows = useMemo(() => {
    if (!recs.data || !catalogue.data || !ctx) return [];
    const list = recs.data.matches.flatMap((m) => {
      const car = catalogue.data.models.find((c) => c.id === m.carId);
      if (!car) return [];
      const o = getOption(car, m.optionId);
      return [{ m, car, o, price: optionPriceRange(car, o).min, energy: estimateOwnership(car, o, assumptions).annualEnergy, metrics: metricsFor(car, o, ctx) }];
    });
    const filtered = fuel === "all" ? list : list.filter((r) => fuelFamily(r.o.fuel as Fuel) === fuel);
    const cmp: Record<SortKey, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      fit: (a, b) => a.m.rank - b.m.rank,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      energy: (a, b) => (a.energy ?? Infinity) - (b.energy ?? Infinity),
    };
    return filtered.sort(cmp[sort]);
  }, [recs.data, catalogue.data, ctx, fuel, sort, assumptions]);

  if (!hydrated) return <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-64" /></div>;

  if (!requirements) {
    return (
      <>
        <PageHeader eyebrow="Top five" title="Your matches will appear here" />
        <EmptyState title="You have not shared your brief yet" message="Answer a few questions and we will build a shortlist around your life. Short on time? Try a sample brief to see how results look." action={<><Button href="/discover">Find My Car</Button><Button variant="secondary" onClick={() => submit(SAMPLE_REQUIREMENTS)}>Try a sample brief</Button></>} />
      </>
    );
  }

  const state = requirements.stateCode ? findState(requirements.stateCode) : undefined;
  const chips = [
    `${formatLakh(requirements.budgetMinLakh)} – ${formatLakh(requirements.budgetMaxLakh)}`,
    `${requirements.minSeats}+ seats`,
    summariseRequirements(requirements).find((i) => i.id === "powertrain")?.value ?? "",
    `${formatKm(requirements.annualKm)}/yr`,
    state ? `${requirements.city ? `${requirements.city}, ` : ""}${state.name}` : "India-wide estimates",
  ];
  const loading = recs.isPending || catalogue.isPending;
  const error = recs.error ?? catalogue.error;
  const result = recs.data;
  const edit = () => { setStep(5); router.push("/discover"); };

  return (
    <>
      <PageHeader
        eyebrow="Top five matches"
        title={result && result.matches.length < 5 ? `Your ${result.matches.length === 0 ? "" : `${result.matches.length} `}best-fitting ${result.matches.length === 1 ? "match" : "matches"}` : "Your five best-fitting cars"}
        description="Five suitable options, not one winner for everyone. Each says why it fits, what you give up, and cites published figures."
        actions={
          <>
            <Button variant="secondary" onClick={edit}><PencilSimple size={18} /> Edit requirements</Button>
            {result && result.matches.length > 0 ? (
              <Button onClick={() => { const { added, skipped } = addMany(result.matches.map((m) => m.carId)); toast(added ? `Added ${added} to comparison${skipped ? `; limit is ${MAX_COMPARE}` : ""}` : "Already in your comparison", added ? "success" : "neutral"); router.push("/compare"); }}>
                <Scales size={18} /> Compare my recommendations
              </Button>
            ) : null}
          </>
        }
      />
      <ul className="-mt-4 mb-8 flex flex-wrap gap-2" aria-label="Your brief">{chips.filter(Boolean).map((c) => <li key={c}><Chip>{c}</Chip></li>)}</ul>

      {loading ? <RecommendationSkeleton /> : null}
      {error ? <ErrorState title="We could not build your shortlist" message={`${error.message} Your answers are safe.`} onRetry={() => { void recs.refetch(); void catalogue.refetch(); }} busy={recs.isFetching || catalogue.isFetching} /> : null}

      {result && catalogue.data ? (
        <>
          {result.shortfallNote ? (
            <div role="status" className="mb-6 rounded-3xl border border-warn/30 bg-warn-soft p-5 text-sm leading-6">
              <p className="font-medium">Fewer than five matches</p>
              <p className="mt-1">{result.shortfallNote}</p>
              {result.exclusionSummary.length > 0 ? <ul className="mt-2 list-disc pl-5 text-muted">{result.exclusionSummary.map((e) => <li key={e}>{e}</li>)}</ul> : null}
              <Button variant="secondary" size="sm" className="mt-3" onClick={edit}>Adjust requirements</Button>
            </div>
          ) : null}
          {result.matches.length === 0 ? (
            <EmptyState icon={<Compass size={28} weight="duotone" />} title="No car meets every requirement" message="We will not stretch your budget, seating or fuel to fill the list. Try widening one of them." action={<Button onClick={edit}>Adjust requirements</Button>} />
          ) : (
            <>
              <div className="mb-6 grid gap-4 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5 no-print">
                <p className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><Funnel size={18} /> Filter and sort your shortlist</p>
                <SelectField id="filter-fuel" label="Fuel" value={fuel} onChange={setFuel} options={[{ value: "all", label: "All fuels" }, { value: "petrol", label: "Petrol" }, { value: "diesel", label: "Diesel" }, { value: "cng", label: "CNG" }, { value: "hybrid", label: "Hybrid" }, { value: "ev", label: "Electric" }]} />
                <SelectField id="sort" label="Sort by" value={sort} onChange={setSort} options={SORTS} />
              </div>
              <p className="sr-only" aria-live="polite">Showing {rows.length} of {result.matches.length} matches.</p>
              {rows.length === 0 ? (
                <EmptyState title="No matches with that filter" message="None of your shortlisted cars use that fuel. Clear the filter to see them all." action={<Button variant="secondary" onClick={() => setFuel("all")}>Clear filter</Button>} />
              ) : (
                <div className="space-y-8">{rows.map((r, i) => <MatchCard key={r.car.id} match={r.m} car={r.car} metrics={r.metrics} index={i} />)}</div>
              )}
            </>
          )}
        </>
      ) : null}
    </>
  );
}
