import type { Car, Option } from "@/types/car";
import type { OwnershipAssumptions } from "@/types/ownership";
import { energyPerKm } from "@/lib/calculations/ownership";
import { carMinPrice, seatsOf } from "./index";

/**
 * Metrics are percentile ranks (0–10) computed from published figures across the whole catalogue.
 * Nothing is hand-rated. A metric is `null` when the underlying figure was not found, and the
 * recommendation engine treats unknowns conservatively and says so.
 */
export interface Metrics {
  safety: number | null;
  efficiency: number | null;
  performance: number | null;
  space: number | null;
  groundClearance: number | null;
  compactness: number | null;
  premium: number;
}

export interface MetricContext {
  powers: number[];
  costPerKm: number[];
  boots: number[];
  wheelbases: number[];
  clearances: number[];
  lengths: number[];
  prices: number[];
  assumptions: OwnershipAssumptions;
}

/** Share of values at or below `v`, scaled to 0–10. */
export function percentile(v: number, all: number[]): number {
  if (all.length === 0) return 5;
  const below = all.filter((x) => x < v).length + all.filter((x) => x === v).length / 2;
  return Math.round((below / all.length) * 100) / 10;
}

export function buildMetricContext(cars: Car[], assumptions: OwnershipAssumptions): MetricContext {
  const powers: number[] = [];
  const costPerKm: number[] = [];
  for (const c of cars) {
    for (const o of c.options) {
      if (o.powerPs) powers.push(o.powerPs.v);
      const e = energyPerKm(o, assumptions);
      if (e !== null) costPerKm.push(e);
    }
  }
  const nums = (f: (c: Car) => number | undefined) => cars.map(f).filter((v): v is number => typeof v === "number");
  return {
    powers,
    costPerKm,
    boots: nums((c) => c.dimensions.bootLitres?.v),
    wheelbases: nums((c) => c.dimensions.wheelbaseMm?.v),
    clearances: nums((c) => c.dimensions.groundClearanceMm?.v),
    lengths: nums((c) => c.dimensions.lengthMm?.v),
    prices: cars.map(carMinPrice),
    assumptions,
  };
}

export function metricsFor(car: Car, option: Option, ctx: MetricContext): Metrics {
  const ncap = car.safety.ncap?.stars ?? null;
  const e = energyPerKm(option, ctx.assumptions);
  const spaceParts: number[] = [];
  const boot = car.dimensions.bootLitres?.v;
  const wb = car.dimensions.wheelbaseMm?.v;
  if (boot !== undefined) spaceParts.push(percentile(boot, ctx.boots));
  if (wb !== undefined) spaceParts.push(percentile(wb, ctx.wheelbases));
  spaceParts.push(Math.min(10, (seatsOf(car) / 7) * 10));
  const gc = car.dimensions.groundClearanceMm?.v;
  return {
    safety: ncap === null ? null : ncap * 2,
    efficiency: e === null ? null : 10 - percentile(e, ctx.costPerKm),
    performance: option.powerPs ? percentile(option.powerPs.v, ctx.powers) : null,
    space: spaceParts.reduce((a, b) => a + b, 0) / spaceParts.length,
    groundClearance: gc === undefined ? null : percentile(gc, ctx.clearances),
    compactness: car.dimensions.lengthMm ? 10 - percentile(car.dimensions.lengthMm.v, ctx.lengths) : null,
    premium: percentile(carMinPrice(car), ctx.prices),
  };
}
