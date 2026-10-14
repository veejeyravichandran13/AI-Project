"use client";

import { useEffect, useState } from "react";
import { ArrowsLeftRight, Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import type { BodyType, Fuel } from "@/types/car";
import { useAppStore } from "@/store/use-app-store";
import { useCars, useCatalogue } from "@/lib/queries";
import { MAX_COMPARE } from "@/lib/constants";
import { BODY_LABEL, FUEL_LABEL, carMaxPrice, carMinPrice, carName, fuelsOf } from "@/lib/catalogue";
import { formatPriceRange } from "@/lib/formatters";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/forms/select-field";
import { CarPhoto } from "@/components/cars/car-photo";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Skeleton } from "@/components/feedback/loading-skeleton";
import { ComparisonLimitNotice } from "./comparison-limit-notice";
import { toast } from "@/store/use-toast-store";
import { controlClass } from "@/components/forms/field-shell";

const PRICE_BANDS = [
  { value: "any", label: "Any price" },
  { value: "0-10", label: "Under ₹10 lakh" },
  { value: "10-20", label: "₹10–20 lakh" },
  { value: "20-50", label: "₹20–50 lakh" },
  { value: "50-9999", label: "₹50 lakh and above" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, picking a car replaces this one instead of adding. */
  replaceId?: string | null;
}

export function ComparisonPicker({ open, onOpenChange, replaceId }: Props) {
  const ids = useAppStore((s) => s.compareIds);
  const add = useAppStore((s) => s.addToCompare);
  const remove = useAppStore((s) => s.removeFromCompare);
  const replace = useAppStore((s) => s.replaceInCompare);
  const catalogue = useCatalogue();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [body, setBody] = useState<BodyType | "any">("any");
  const [fuel, setFuel] = useState<Fuel | "any">("any");
  const [brand, setBrand] = useState("any");
  const [band, setBand] = useState("any");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const [lo, hi] = band === "any" ? [undefined, undefined] : band.split("-").map((n) => Number(n) * 100000);
  const { data, isPending, isError, error, refetch, isFetching } = useCars({
    query: debounced,
    bodyTypes: body === "any" ? undefined : [body],
    fuels: fuel === "any" ? undefined : [fuel],
    brands: brand === "any" ? undefined : [brand],
    minPriceInr: lo,
    maxPriceInr: hi,
  });

  const replacing = Boolean(replaceId);
  const full = ids.length >= MAX_COMPARE;
  const brands = [...new Set(catalogue.data?.brands.map((b) => b.name) ?? [])].sort();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      variant="sheet"
      title={replacing ? "Replace this car" : "Choose cars to compare"}
      description={replacing ? "Pick the car that should take its place." : `Pick up to ${MAX_COMPARE} cars from any manufacturer, body style or price band.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">{ids.length} of {MAX_COMPARE} selected</p>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="picker-search" className="sr-only">Search cars by name</label>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input id="picker-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by brand or model" className={`${controlClass} pl-11`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField id="pf-body" label="Body style" value={body} onChange={setBody} options={[{ value: "any", label: "Any body style" }, ...(["hatchback", "sedan", "compact-suv", "suv", "mpv", "coupe", "pickup"] as BodyType[]).map((b) => ({ value: b, label: BODY_LABEL[b] }))]} />
          <SelectField id="pf-fuel" label="Fuel" value={fuel} onChange={setFuel} options={[{ value: "any", label: "Any fuel" }, ...(["petrol", "diesel", "cng", "mild-hybrid", "strong-hybrid", "ev"] as Fuel[]).map((f) => ({ value: f, label: FUEL_LABEL[f] }))]} />
          <SelectField id="pf-brand" label="Manufacturer" value={brand} onChange={setBrand} options={[{ value: "any", label: "Any manufacturer" }, ...brands.map((b) => ({ value: b, label: b }))]} />
          <SelectField id="pf-band" label="Price band" value={band} onChange={setBand} options={PRICE_BANDS} />
        </div>
        {!replacing ? <ComparisonLimitNotice count={ids.length} /> : null}

        {isPending ? (
          <div role="status" aria-busy="true" className="space-y-3"><span className="sr-only">Loading cars…</span>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : isError ? (
          <ErrorState title="Could not load the catalogue" message={error.message} onRetry={() => void refetch()} busy={isFetching} />
        ) : data.length === 0 ? (
          <EmptyState title="No cars match those filters" message="Try a different body style, fuel or price band." action={<Button variant="secondary" onClick={() => { setQuery(""); setBody("any"); setFuel("any"); setBrand("any"); setBand("any"); }}>Clear filters</Button>} />
        ) : (
          <ul className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-label="Cars in the catalogue">
            {data.map((v) => {
              const selected = ids.includes(v.id);
              const name = carName(v);
              const disabledAdd = !replacing && !selected && full;
              return (
                <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
                  <CarPhoto car={v} className="h-16 w-24 shrink-0 rounded-xl sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="text-sm text-muted">{BODY_LABEL[v.bodyType]} · {v.seats.v} seats</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="tnum text-sm font-medium">{formatPriceRange(carMinPrice(v), carMaxPrice(v))}</span>
                      {fuelsOf(v).slice(0, 3).map((f) => <Badge key={f}>{FUEL_LABEL[f]}</Badge>)}
                    </div>
                  </div>
                  {replacing ? (
                    <Button size="sm" variant="secondary" disabled={selected && v.id !== replaceId} onClick={() => { replace(replaceId!, v.id); toast(`Replaced with ${name}`, "success"); onOpenChange(false); }} aria-label={selected && v.id !== replaceId ? `${name} is already selected` : `Use ${name}`}>
                      <ArrowsLeftRight size={16} /> {selected && v.id !== replaceId ? "Selected" : "Use"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={selected ? "primary" : "secondary"}
                      disabled={disabledAdd}
                      aria-pressed={selected}
                      aria-label={selected ? `Remove ${name} from comparison` : disabledAdd ? `Cannot add ${name}: comparison is full` : `Add ${name} to comparison`}
                      onClick={() => { if (selected) remove(v.id); else if (add(v.id) === "full") toast(`You can compare up to ${MAX_COMPARE} cars.`, "warning"); }}
                    >
                      {selected ? <Check size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
                      {selected ? "Added" : "Add"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
