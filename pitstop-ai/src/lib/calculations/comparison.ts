import type { Fact } from "@/types/car";
import type { ComparisonItem } from "@/lib/mock-api";
import type { Requirements } from "@/types/recommendation";
import { BODY_LABEL, FUEL_LABEL, SEGMENT_LABEL, getOption, optionPriceRange, segmentOf } from "@/lib/catalogue";
import { NOT_APPLICABLE, NOT_AVAILABLE, formatInr, formatNumber, formatPriceCompact } from "@/lib/formatters";
import { claimedEfficiency, onRoadPrice } from "./ownership";

export interface Cell {
  text: string;
  numeric: number | null;
  kind: "value" | "missing" | "na";
  hint?: string;
  /** Source of this value, so the table can link to it on the car's page. */
  cite?: { carId: string; sourceId: string };
}

export interface RowDef {
  id: string;
  group: string;
  label: string;
  better?: "higher" | "lower";
  /** Only highlight when every car shares the same fuel kind (kmpl vs km/kWh are not comparable). */
  sameKindOnly?: boolean;
  cell: (item: ComparisonItem) => Cell;
}

const missing = (): Cell => ({ text: NOT_AVAILABLE, numeric: null, kind: "missing" });
const na = (): Cell => ({ text: NOT_APPLICABLE, numeric: null, kind: "na" });
const text = (t: string): Cell => ({ text: t, numeric: null, kind: "value" });

function fromFact(item: ComparisonItem, f: Fact<number> | null | undefined, fmt: (n: number) => string): Cell {
  if (!f) return missing();
  return { text: fmt(f.v), numeric: f.v, kind: "value", cite: { carId: item.car.id, sourceId: f.s } };
}

const opt = (i: ComparisonItem) => getOption(i.car, i.optionId);
const isEv = (i: ComparisonItem) => opt(i).fuel === "ev";

export const COMPARISON_ROWS: RowDef[] = [
  { id: "body", group: "Overview", label: "Body style", cell: (i) => text(BODY_LABEL[i.car.bodyType]) },
  { id: "segment", group: "Overview", label: "Price band", cell: (i) => text(SEGMENT_LABEL[segmentOf(i.car)]) },
  { id: "seats", group: "Overview", label: "Seating (max)", better: "higher", cell: (i) => fromFact(i, i.car.seats, (n) => `${n} seats`) },

  { id: "pricemin", group: "Price", label: "Model starting price (ex-showroom)", better: "lower", cell: (i) => fromFact(i, i.car.price.minInr, (n) => formatPriceCompact(n)) },
  {
    id: "priceopt",
    group: "Price",
    label: "Selected engine, ex-showroom",
    better: "lower",
    cell: (i) => {
      const o = opt(i);
      if (!o.fromPriceInr) return { text: "Not published separately", numeric: null, kind: "missing" };
      return fromFact(i, o.fromPriceInr, (n) => formatPriceCompact(n));
    },
  },
  {
    id: "onroad",
    group: "Price",
    label: "Indicative on-road (estimate)",
    cell: (i) => {
      const p = optionPriceRange(i.car, opt(i)).min;
      const v = onRoadPrice(p, i.assumptions.onRoadLoadingPct);
      return { text: formatPriceCompact(v), numeric: v, kind: "value", hint: `Ex-showroom + ${formatNumber(i.assumptions.onRoadLoadingPct, 0)}% sample loading` };
    },
  },

  { id: "fuel", group: "Engine", label: "Fuel", cell: (i) => text(FUEL_LABEL[opt(i).fuel]) },
  { id: "engine", group: "Engine", label: "Engine / motor", cell: (i) => text(opt(i).engine) },
  { id: "transmission", group: "Engine", label: "Transmission", cell: (i) => text(opt(i).transmission) },
  { id: "power", group: "Engine", label: "Power", better: "higher", cell: (i) => fromFact(i, opt(i).powerPs, (n) => `${formatNumber(n, 0)} PS`) },
  { id: "torque", group: "Engine", label: "Torque", better: "higher", cell: (i) => fromFact(i, opt(i).torqueNm, (n) => `${formatNumber(n, 0)} Nm`) },

  {
    id: "efficiency",
    group: "Efficiency and range",
    label: "Claimed efficiency",
    better: "higher",
    sameKindOnly: true,
    cell: (i) => {
      const o = opt(i);
      if (o.fuel === "ev") {
        const e = claimedEfficiency(o);
        return e === null ? missing() : { text: `${formatNumber(e, 1)} km/kWh`, numeric: e, kind: "value", hint: "Derived: claimed range ÷ battery" };
      }
      return o.efficiency ? { text: `${o.efficiency.value} ${o.efficiency.unit}`, numeric: o.efficiency.value, kind: "value", hint: o.efficiency.basis, cite: { carId: i.car.id, sourceId: o.efficiency.s } } : missing();
    },
  },
  { id: "range", group: "Efficiency and range", label: "Claimed range", better: "higher", sameKindOnly: true, cell: (i) => (isEv(i) ? fromFact(i, opt(i).ev?.claimedRangeKm, (n) => `${formatNumber(n, 0)} km`) : na()) },
  { id: "battery", group: "Efficiency and range", label: "Battery", cell: (i) => (isEv(i) ? fromFact(i, opt(i).ev?.batteryKwh, (n) => `${formatNumber(n, 1)} kWh`) : na()) },
  {
    id: "per100",
    group: "Efficiency and range",
    label: "Energy cost per 100 km (your assumptions)",
    better: "lower",
    cell: (i) => (i.estimate.energyPerKm === null ? missing() : { text: formatInr(i.estimate.energyPerKm * 100), numeric: i.estimate.energyPerKm * 100, kind: "value", hint: "Claimed efficiency at 85% real-world, sample prices" }),
  },
  { id: "annual", group: "Efficiency and range", label: "Annual energy cost", better: "lower", cell: (i) => (i.estimate.annualEnergy === null ? missing() : { text: formatInr(i.estimate.annualEnergy), numeric: i.estimate.annualEnergy, kind: "value" }) },

  { id: "length", group: "Size and space", label: "Length", cell: (i) => fromFact(i, i.car.dimensions.lengthMm, (n) => `${formatNumber(n, 0)} mm`) },
  { id: "wheelbase", group: "Size and space", label: "Wheelbase", better: "higher", cell: (i) => fromFact(i, i.car.dimensions.wheelbaseMm, (n) => `${formatNumber(n, 0)} mm`) },
  { id: "clearance", group: "Size and space", label: "Ground clearance", better: "higher", cell: (i) => fromFact(i, i.car.dimensions.groundClearanceMm, (n) => `${formatNumber(n, 0)} mm`) },
  { id: "boot", group: "Size and space", label: "Boot space", better: "higher", cell: (i) => fromFact(i, i.car.dimensions.bootLitres, (n) => `${formatNumber(n, 0)} L`) },
  { id: "weight", group: "Size and space", label: "Kerb weight", cell: (i) => fromFact(i, i.car.dimensions.kerbWeightKg, (n) => `${formatNumber(n, 0)} kg`) },

  {
    id: "ncap",
    group: "Safety",
    label: "NCAP stars",
    better: "higher",
    cell: (i) => {
      const n = i.car.safety.ncap;
      return n ? { text: `${n.stars} / 5 · ${n.body}${n.year ? ` ${n.year}` : ""}`, numeric: n.stars, kind: "value", cite: { carId: i.car.id, sourceId: n.s } } : { text: "No rating found", numeric: null, kind: "missing" };
    },
  },
  { id: "airbags", group: "Safety", label: "Standard airbags", better: "higher", cell: (i) => fromFact(i, i.car.safety.airbagsStandard, (n) => `${n}`) },
  { id: "warranty", group: "Safety", label: "Warranty", cell: (i) => (i.car.warranty ? { text: i.car.warranty.v, numeric: null, kind: "value", cite: { carId: i.car.id, sourceId: i.car.warranty.s } } : missing()) },

  {
    id: "tco",
    group: "Ownership",
    label: "Estimated total cost of ownership",
    better: "lower",
    cell: (i) => (i.estimate.totalCost === null ? { text: "Not enough information", numeric: null, kind: "missing" } : { text: formatPriceCompact(i.estimate.totalCost), numeric: i.estimate.totalCost, kind: "value", hint: i.estimate.missing[0] }),
  },
];

export const ROW_GROUPS = [...new Set(COMPARISON_ROWS.map((r) => r.group))];

/**
 * Indexes of the best cars for a row, or an empty set when a fair highlight is impossible: fewer
 * than two cars, any value missing or not applicable, all values equal, or mixed fuel kinds.
 */
export function bestIndexes(row: RowDef, items: ComparisonItem[]): Set<number> {
  if (!row.better || items.length < 2) return new Set();
  const cells = items.map((i) => row.cell(i));
  if (cells.some((c) => c.kind !== "value" || c.numeric === null)) return new Set();
  if (row.sameKindOnly && new Set(items.map((i) => isEv(i))).size > 1) return new Set();
  const values = cells.map((c) => c.numeric as number);
  const best = row.better === "higher" ? Math.max(...values) : Math.min(...values);
  if (values.every((v) => v === best)) return new Set();
  return new Set(values.flatMap((v, i) => (v === best ? [i] : [])));
}

/** What a row's value means for this buyer, or null when nothing useful can be said. */
export function personalMeaning(rowId: string, item: ComparisonItem, req: Requirements | null): string | null {
  if (!req) return null;
  const { car, estimate } = item;
  switch (rowId) {
    case "seats":
      return car.seats.v >= req.minSeats ? `Covers the ${req.minSeats} seats you need.` : `Falls short of the ${req.minSeats} seats you need.`;
    case "clearance": {
      const gc = car.dimensions.groundClearanceMm?.v;
      if (gc === undefined || req.usage !== "rough") return null;
      return gc >= 200 ? "Comfortable for the rough roads you described." : "Low for rough roads; expect care over bad surfaces.";
    }
    case "boot": {
      const b = car.dimensions.bootLitres?.v;
      if (b === undefined) return "Boot size not published, so check luggage fit in person.";
      return req.minSeats >= 5 ? (b >= 400 ? "Roomy for family luggage." : b < 250 ? "Tight for a full family's luggage." : "Enough for everyday loads.") : null;
    }
    case "annual":
      return estimate.annualEnergy === null ? null : `About ${formatInr(Math.round(estimate.annualEnergy / 12))} a month at ${formatNumber(req.annualKm, 0)} km a year.`;
    case "range": {
      const r = getOption(car, item.optionId).ev?.claimedRangeKm?.v;
      if (r === undefined) return null;
      return req.usage === "highway" ? "Real highway range is usually well below the claim; plan charging stops." : "Plenty for daily use if you charge regularly.";
    }
    case "ncap":
      return car.safety.ncap ? null : "No published result, so safety cannot be compared on a rating.";
    default:
      return null;
  }
}
