import type { Car, Option } from "@/types/car";
import type { BreakEven, OwnershipAssumptions, OwnershipEstimate } from "@/types/ownership";
import type { Requirements } from "@/types/recommendation";
import { INDIA_WIDE_DEFAULTS, findState } from "@/data/locations";
import { OWNERSHIP_YEARS } from "@/lib/constants";
import { formatNumber, formatYears } from "@/lib/formatters";
import { fuelFamily, optionPriceRange } from "@/lib/catalogue";

const CHARGING_SHARE: Record<Requirements["chargingAccess"], number> = { home: 0.9, both: 0.6, public: 0, none: 0, "not-sure": 0.5 };

export const DEFAULT_REAL_WORLD_FACTOR = 0.85;
export const BREAK_EVEN_HORIZON_YEARS = 20;

/** Generic servicing/consumables allowances. These are editable assumptions, not model data. */
export const DEFAULT_MAINTENANCE = { petrol: 0.65, diesel: 0.8, cng: 0.7, hybrid: 0.7, ev: 0.35 } as const;

export function defaultAssumptions(req: Requirements | null, stateCodeOverride?: string): OwnershipAssumptions {
  const code = stateCodeOverride ?? req?.stateCode ?? "";
  const state = code ? findState(code) : undefined;
  const src = state ?? INDIA_WIDE_DEFAULTS;
  return {
    stateCode: state ? state.code : "",
    annualKm: req?.annualKm ?? 12000,
    years: req ? (OWNERSHIP_YEARS[req.ownership] ?? 5) : 5,
    petrolPerLitre: src.petrolPerLitre,
    dieselPerLitre: src.dieselPerLitre,
    cngPerKg: src.cngPerKg,
    homeTariffPerKwh: src.homeTariffPerKwh,
    publicTariffPerKwh: src.publicTariffPerKwh,
    homeChargingShare: req ? CHARGING_SHARE[req.chargingAccess] : 0.5,
    realWorldFactor: DEFAULT_REAL_WORLD_FACTOR,
    priceBasis: "ex-showroom",
    onRoadLoadingPct: src.onRoadLoadingPct,
    maintenancePerKm: { ...DEFAULT_MAINTENANCE },
  };
}

export const onRoadPrice = (exShowroom: number, loadingPct: number) => Math.round(exShowroom * (1 + loadingPct / 100));

/** Claimed km per litre / kg / kWh, or null. For EVs derived from claimed range ÷ battery. */
export function claimedEfficiency(o: Option): number | null {
  if (o.fuel === "ev") {
    const range = o.ev?.claimedRangeKm?.v;
    const kwh = o.ev?.batteryKwh?.v;
    if (!range || !kwh) return null;
    return range / kwh;
  }
  return o.efficiency?.value ?? null;
}

/** Energy cost in ₹ per km under the given assumptions, or null if the figure is not published. */
export function energyPerKm(o: Option, a: OwnershipAssumptions): number | null {
  const eff = claimedEfficiency(o);
  if (eff === null || eff <= 0) return null;
  const real = eff * a.realWorldFactor;
  switch (fuelFamily(o.fuel)) {
    case "ev": {
      const share = Math.min(1, Math.max(0, a.homeChargingShare));
      return (share * a.homeTariffPerKwh + (1 - share) * a.publicTariffPerKwh) / real;
    }
    case "diesel":
      return a.dieselPerLitre / real;
    case "cng":
      return a.cngPerKg / real;
    default:
      return a.petrolPerLitre / real;
  }
}

export function estimateOwnership(car: Car, o: Option, a: OwnershipAssumptions): OwnershipEstimate {
  const missing: string[] = [];
  const range = optionPriceRange(car, o);
  // When an engine's own price is unpublished we use the model's starting price and say so.
  const ex = range.min;
  const acquisition = a.priceBasis === "on-road" ? onRoadPrice(ex, a.onRoadLoadingPct) : ex;
  if (!range.exact) missing.push("Price for this engine is unpublished (model starting price used)");

  const perKm = energyPerKm(o, a);
  if (perKm === null) missing.push(o.fuel === "ev" ? "Claimed range or battery size" : "Claimed efficiency");

  const mPerKm = a.maintenancePerKm[fuelFamily(o.fuel)];
  const annualEnergy = perKm === null ? null : perKm * a.annualKm;
  const annualMaintenance = mPerKm * a.annualKm;
  const insufficient = annualEnergy === null;
  const running = (annualEnergy ?? 0) + annualMaintenance;

  return {
    carId: car.id,
    optionId: o.id,
    acquisition,
    acquisitionScope: a.priceBasis,
    energyPerKm: perKm,
    annualEnergy: annualEnergy === null ? null : Math.round(annualEnergy),
    cumulativeEnergy: annualEnergy === null ? null : Math.round(annualEnergy * a.years),
    annualMaintenance: Math.round(annualMaintenance),
    cumulativeMaintenance: Math.round(annualMaintenance * a.years),
    totalCost: insufficient ? null : Math.round(acquisition + running * a.years),
    completeness: insufficient ? "insufficient" : "full",
    missing,
    trajectory: insufficient ? [] : Array.from({ length: Math.ceil(a.years) + 1 }, (_, y) => ({ year: y, cumulative: Math.round(acquisition + running * Math.min(y, a.years)) })),
  };
}

/**
 * Break-even only when both estimates are complete on the same price basis, one car costs more to
 * buy but less to run, and the lines cross within the horizon. Otherwise explain why not.
 */
export function computeBreakEven(
  a: { name: string; estimate: OwnershipEstimate },
  b: { name: string; estimate: OwnershipEstimate },
): BreakEven | null {
  const [cheap, dear] = (a.estimate.acquisition ?? 0) <= (b.estimate.acquisition ?? 0) ? [a, b] : [b, a];
  const base = { premiumCarId: dear.estimate.carId, baselineCarId: cheap.estimate.carId };
  if (a.estimate.completeness !== "full" || b.estimate.completeness !== "full") {
    return { ...base, years: null, reachedWithinHorizon: false, statement: `Not enough information to estimate a break-even between ${a.name} and ${b.name}: a cost input is missing.` };
  }
  if (a.estimate.acquisitionScope !== b.estimate.acquisitionScope) return null;
  const runCheap = (cheap.estimate.annualEnergy ?? 0) + cheap.estimate.annualMaintenance;
  const runDear = (dear.estimate.annualEnergy ?? 0) + dear.estimate.annualMaintenance;
  const upfront = (dear.estimate.acquisition ?? 0) - (cheap.estimate.acquisition ?? 0);
  const saving = runCheap - runDear;
  if (upfront <= 0) return null;
  if (saving <= 0) return { ...base, years: null, reachedWithinHorizon: false, statement: `${dear.name} costs more to buy and is not cheaper to run than ${cheap.name} under these assumptions, so there is no break-even.` };
  const years = upfront / saving;
  if (years > BREAK_EVEN_HORIZON_YEARS) return { ...base, years: null, reachedWithinHorizon: false, statement: `${dear.name} would not recover its higher price against ${cheap.name} within ${BREAK_EVEN_HORIZON_YEARS} years under these assumptions.` };
  return { ...base, years, reachedWithinHorizon: true, statement: `Under these assumptions, ${dear.name} recovers its higher price against ${cheap.name} in about ${formatNumber(years, 1)} years (${formatYears(years)}) of running costs. Energy prices, usage and resale will move this.` };
}

