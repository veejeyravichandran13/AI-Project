"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Funnel, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";
import type { BodyType, Car, CatalogueFilters, Fuel } from "@/types/car";
import { useCars, useCatalogue } from "@/lib/queries";
import { useMounted } from "@/lib/hooks";
import { filtersToParams, paramsToFilters, type SortKey } from "@/lib/filters-url";
import { parseSmartSearch } from "@/lib/smart-search";
import { BrandLogo } from "@/components/brands/brand-logo";
import { BODY_LABEL, FUEL_LABEL, brandTier, carMinPrice, carName, ncapStars, powerRange } from "@/lib/catalogue";
import { defaultAssumptions, energyPerKm } from "@/lib/calculations/ownership";
import { formatLakh } from "@/lib/formatters";
import { BUDGET_BOUNDS } from "@/lib/constants";
import { CarCard } from "@/components/cars/car-card";
import { BudgetRangeSlider } from "@/components/forms/budget-range-slider";
import { SelectField } from "@/components/forms/select-field";
import { controlClass } from "@/components/forms/field-shell";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Skeleton } from "@/components/feedback/loading-skeleton";
import { cn } from "@/lib/utils/cn";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "power", label: "Most powerful" },
  { value: "efficiency", label: "Lowest running cost" },
  { value: "safety", label: "Highest NCAP stars" },
  { value: "name", label: "Name A to Z" },
];

const FUELS: Fuel[] = ["petrol", "diesel", "cng", "mild-hybrid", "strong-hybrid", "ev"];
const BODIES: BodyType[] = ["hatchback", "sedan", "compact-suv", "suv", "mpv", "coupe", "pickup"];
const A = defaultAssumptions(null);

const cheapestRun = (c: Car) => Math.min(...c.options.map((o) => energyPerKm(o, A) ?? Infinity));

function sortCars(cars: Car[], sort: SortKey): Car[] {
  const s = [...cars];
  const cmp: Record<SortKey, (a: Car, b: Car) => number> = {
    "price-asc": (a, b) => carMinPrice(a) - carMinPrice(b),
    "price-desc": (a, b) => carMinPrice(b) - carMinPrice(a),
    power: (a, b) => (powerRange(b)?.max ?? 0) - (powerRange(a)?.max ?? 0),
    efficiency: (a, b) => cheapestRun(a) - cheapestRun(b),
    safety: (a, b) => (ncapStars(b) ?? -1) - (ncapStars(a) ?? -1) || carMinPrice(a) - carMinPrice(b),
    name: (a, b) => carName(a).localeCompare(carName(b)),
  };
  return s.sort(cmp[sort]);
}

function Toggle({ on, onClick, children, tone }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "ev" }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        on ? (tone === "ev" ? "border-ev bg-ev-soft text-ev" : "border-accent bg-accent-soft text-accent") : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function ExploreView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { filters, sort } = useMemo(() => paramsToFilters(new URLSearchParams(params.toString())), [params]);
  const [sheet, setSheet] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [text, setText] = useState(filters.query ?? "");

  const mounted = useMounted();
  const all = useCatalogue();
  const cars = useCars(filters);
  const loading = !mounted || cars.isPending;

  const update = (patch: Partial<CatalogueFilters>, nextSort: SortKey = sort) => {
    const merged: CatalogueFilters = { ...filters, ...patch };
    for (const k of Object.keys(merged) as (keyof CatalogueFilters)[]) {
      const v = merged[k];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete merged[k];
    }
    const q = filtersToParams(merged, nextSort);
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const toggleIn = <T extends string>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter((x) => x !== v) : [...(arr ?? []), v]);

  const brandCounts = useMemo(() => {
    const m = new Map<string, { n: number; min: number; logo: string | null }>();
    if (!mounted) return [];
    all.data?.models.forEach((c) => {
      const cur = m.get(c.brand) ?? { n: 0, min: Infinity, logo: c.brandLogo ?? null };
      m.set(c.brand, { n: cur.n + 1, min: Math.min(cur.min, carMinPrice(c)), logo: cur.logo });
    });
    // Popular Indian-market brands first (largest lineups on top), then premium, then exotic.
    const rank = (min: number) => (brandTier(min) === "mass" ? 0 : brandTier(min) === "premium" ? 1 : 2);
    return [...m.entries()]
      .sort((a, b) => rank(a[1].min) - rank(b[1].min) || b[1].n - a[1].n || a[0].localeCompare(b[0]))
      .map(([brand, v]) => [brand, v.n, v.logo] as [string, number, string | null]);
  }, [all.data, mounted]);

  const active: { key: string; label: string; clear: () => void }[] = [];
  filters.brands?.forEach((b) => active.push({ key: `b-${b}`, label: b, clear: () => update({ brands: filters.brands!.filter((x) => x !== b) }) }));
  filters.bodyTypes?.forEach((b) => active.push({ key: `bt-${b}`, label: BODY_LABEL[b], clear: () => update({ bodyTypes: filters.bodyTypes!.filter((x) => x !== b) }) }));
  filters.fuels?.forEach((f) => active.push({ key: `f-${f}`, label: FUEL_LABEL[f], clear: () => update({ fuels: filters.fuels!.filter((x) => x !== f) }) }));
  if (filters.minPriceInr !== undefined || filters.maxPriceInr !== undefined) active.push({ key: "price", label: `${formatLakh((filters.minPriceInr ?? 0) / 100000)} – ${filters.maxPriceInr !== undefined ? formatLakh(filters.maxPriceInr / 100000) : "any"}`, clear: () => update({ minPriceInr: undefined, maxPriceInr: undefined }) });
  if (filters.minSeats) active.push({ key: "seats", label: `${filters.minSeats}+ seats`, clear: () => update({ minSeats: undefined }) });
  if (filters.minNcapStars) active.push({ key: "ncap", label: `${filters.minNcapStars}+ NCAP stars`, clear: () => update({ minNcapStars: undefined }) });
  if (filters.query) active.push({ key: "q", label: `“${filters.query}”`, clear: () => update({ query: undefined }) });

  const submitText = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return update({ query: undefined });
    if (!all.data) return update({ query: v });
    const parsed = parseSmartSearch(v, all.data.brands, all.data.models.map((m) => m.model));
    const found = parsed.understood.length || parsed.filters.query ? parsed.filters : { query: v };
    router.replace(`${pathname}?${filtersToParams(found, sort)}`, { scroll: false });
  };

  const results = mounted && cars.data ? sortCars(cars.data, sort) : [];
  const lo = (filters.minPriceInr ?? BUDGET_BOUNDS.minLakh * 100000) / 100000;
  const hi = (filters.maxPriceInr ?? BUDGET_BOUNDS.maxLakh * 100000) / 100000;

  const panel = (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Price (ex-showroom)</legend>
        <BudgetRangeSlider
          compact
          min={lo}
          max={hi}
          onChange={(a, b) => update({ minPriceInr: a <= BUDGET_BOUNDS.minLakh ? undefined : a * 100000, maxPriceInr: b >= BUDGET_BOUNDS.maxLakh ? undefined : b * 100000 })}
        />
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Body style</legend>
        <div className="flex flex-wrap gap-2">
          {BODIES.map((b) => <Toggle key={b} on={!!filters.bodyTypes?.includes(b)} onClick={() => update({ bodyTypes: toggleIn(filters.bodyTypes, b) })}>{BODY_LABEL[b]}</Toggle>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Fuel</legend>
        <div className="flex flex-wrap gap-2">
          {FUELS.map((f) => <Toggle key={f} tone={f === "ev" ? "ev" : undefined} on={!!filters.fuels?.includes(f)} onClick={() => update({ fuels: toggleIn(filters.fuels, f) })}>{FUEL_LABEL[f]}</Toggle>)}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <SelectField id="f-seats" label="Seats" value={filters.minSeats ?? 0} onChange={(v) => update({ minSeats: v || undefined })} options={[{ value: 0, label: "Any" }, { value: 5, label: "5+" }, { value: 6, label: "6+" }, { value: 7, label: "7+" }]} />
        <SelectField id="f-ncap" label="NCAP stars" value={filters.minNcapStars ?? 0} onChange={(v) => update({ minNcapStars: v || undefined })} options={[{ value: 0, label: "Any" }, { value: 3, label: "3+" }, { value: 4, label: "4+" }, { value: 5, label: "5" }]} />
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Manufacturer</legend>
        <label className="sr-only" htmlFor="brand-filter">Filter manufacturers</label>
        <input id="brand-filter" value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Find a manufacturer" className={cn(controlClass, "mb-2 min-h-10 text-sm")} />
        <ul className="scroll-region max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {brandCounts.filter(([b]) => b.toLowerCase().includes(brandQuery.toLowerCase())).map(([b, n, logo]) => {
            const on = !!filters.brands?.includes(b);
            return (
              <li key={b}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-surface-2">
                  <input type="checkbox" checked={on} onChange={() => update({ brands: toggleIn(filters.brands, b) })} className="size-4 accent-[var(--accent)]" />
                  <BrandLogo name={b} logo={logo} className="h-7 w-12 shrink-0 text-[8px]" pad="px-1 py-0.5" />
                  <span className="flex-1">{b}</span>
                  <span className="tnum text-xs text-muted">{n}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {active.length > 0 ? <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}><X size={16} /> Reset all filters</Button> : null}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="scroll-region sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border border-line bg-surface p-5 pr-4">{panel}</div>
      </aside>

      <div className="min-w-0">
        <form onSubmit={submitText} role="search" className="glass mb-5 flex items-center gap-2 rounded-full p-1.5 pl-5">
          <Sparkle size={18} weight="fill" className="shrink-0 text-accent" />
          <label htmlFor="explore-q" className="sr-only">Search or describe a car</label>
          <input id="explore-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search a model, or describe: 7-seater diesel SUV under 20 lakh" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/80" />
          <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:brightness-110"><MagnifyingGlass size={16} weight="bold" /><span className="hidden sm:inline">Search</span></button>
        </form>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {loading ? "Loading cars…" : <><strong className="tnum text-base text-ink">{results.length}</strong> {results.length === 1 ? "car" : "cars"}{mounted && all.data ? ` of ${all.data.models.length}` : ""}</>}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheet(true)}><Funnel size={16} /> Filters{active.length ? ` (${active.length})` : ""}</Button>
            <label className="sr-only" htmlFor="sort">Sort cars</label>
            <select id="sort" value={sort} onChange={(e) => update({}, e.target.value as SortKey)} className="min-h-9 rounded-full border border-line bg-surface px-3 text-sm">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {active.length > 0 ? (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
            {active.map((a) => (
              <li key={a.key}>
                <button type="button" onClick={a.clear} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-medium text-accent hover:brightness-95" aria-label={`Remove filter ${a.label}`}>{a.label} <X size={12} weight="bold" /></button>
              </li>
            ))}
          </ul>
        ) : null}

        {loading ? (
          <div role="status" aria-busy="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <span className="sr-only">Loading cars…</span>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
          </div>
        ) : cars.isError ? (
          <ErrorState title="Could not load cars" message={cars.error.message} onRetry={() => void cars.refetch()} busy={cars.isFetching} />
        ) : results.length === 0 ? (
          <EmptyState title="No cars match those filters" message="Try widening the price range or removing a filter. We only show models with published data." action={<Button variant="secondary" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</Button>} />
        ) : (
          <ul className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity", cars.isFetching && "opacity-60")}>
            {results.map((c, i) => <li key={c.id} className="min-w-0"><CarCard car={c} index={i} className="h-full" /></li>)}
          </ul>
        )}
      </div>

      <Modal open={sheet} onOpenChange={setSheet} variant="sheet" title="Filters" footer={<Button className="w-full" onClick={() => setSheet(false)}>Show {results.length} {results.length === 1 ? "car" : "cars"}</Button>}>
        {panel}
      </Modal>
    </div>
  );
}
