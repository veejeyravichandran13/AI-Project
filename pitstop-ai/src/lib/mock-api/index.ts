/**
 * Service boundary. The catalogue is real (see data-src/ and scripts/build-data.mjs) but is still
 * served through async functions with a little simulated latency, so swapping in a live API later
 * changes only these bodies. The catalogue JSON is code-split and loaded on first use.
 */
import type { Car, Catalogue, CatalogueFilters } from "@/types/car";
import type { CarFit, MatchResult, Requirements } from "@/types/recommendation";
import type { BreakEven, OwnershipAssumptions, OwnershipEstimate } from "@/types/ownership";
import { filterCars, getOption, carName } from "@/lib/catalogue";
import { buildMetricContext, metricsFor, type Metrics } from "@/lib/catalogue/metrics";
import { computeBreakEven, defaultAssumptions, estimateOwnership } from "@/lib/calculations/ownership";
import { evaluateCar, recommend } from "@/lib/calculations/recommend";

export class MockApiError extends Error {
  constructor(message: string, readonly code: "NETWORK" | "NOT_FOUND") {
    super(message);
    this.name = "MockApiError";
  }
}

const config = { latencyScale: 1, failing: false };

/** Test and demo hooks. */
export function configureMockApi(next: Partial<typeof config>) {
  Object.assign(config, next);
}

let cache: Promise<Catalogue> | null = null;
const loadCatalogue = (): Promise<Catalogue> =>
  (cache ??= import("@/data/generated/catalogue.json").then((m) => m.default as unknown as Catalogue));

/** Tests can inject a catalogue instead of the generated one. */
export function setCatalogueForTests(c: Catalogue) {
  cache = Promise.resolve(c);
}

async function simulate<T>(baseMs: number, work: (c: Catalogue) => T): Promise<T> {
  const catalogue = await loadCatalogue();
  const ms = baseMs * config.latencyScale;
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  if (config.failing) throw new MockApiError("The demo service could not be reached. This is a simulated failure.", "NETWORK");
  return work(catalogue);
}

const find = (c: Catalogue, id: string): Car => {
  const car = c.models.find((m) => m.id === id);
  if (!car) throw new MockApiError(`No car with id "${id}" exists in the catalogue.`, "NOT_FOUND");
  return car;
};

export const getCatalogue = () => simulate(120, (c) => c);
export const getCars = (filters: CatalogueFilters = {}) => simulate(120, (c) => filterCars(c.models, filters));
export const getCarById = (id: string) => simulate(120, (c) => find(c, id));

export const getBrand = (slug: string) =>
  simulate(120, (c) => {
    const brand = c.brands.find((b) => b.slug === slug);
    if (!brand) throw new MockApiError(`No brand "${slug}" in the catalogue.`, "NOT_FOUND");
    return { brand, cars: c.models.filter((m) => m.brand === brand.name) };
  });

export const getRecommendations = (req: Requirements): Promise<MatchResult> =>
  simulate(900, (c) => recommend(c.models, req, buildMetricContext(c.models, defaultAssumptions(req))));

export const getCarFit = (carId: string, req: Requirements, optionId?: string | null): Promise<CarFit> =>
  simulate(150, (c) => evaluateCar(find(c, carId), req, buildMetricContext(c.models, defaultAssumptions(req)), optionId));

export interface OwnershipComparison {
  estimates: OwnershipEstimate[];
  breakEvens: BreakEven[];
}

export const getOwnershipComparison = (picks: Pick[], assumptions: OwnershipAssumptions): Promise<OwnershipComparison> =>
  simulate(200, (c) => {
    const rows = picks.map((p) => {
      const car = find(c, p.carId);
      const o = getOption(car, p.optionId);
      return { name: `${carName(car)} ${o.label}`, estimate: estimateOwnership(car, o, assumptions) };
    });
    const breakEvens: BreakEven[] = [];
    const sorted = [...rows].sort((a, b) => (a.estimate.acquisition ?? Infinity) - (b.estimate.acquisition ?? Infinity));
    for (const other of sorted.slice(1)) {
      const be = computeBreakEven(sorted[0], other);
      if (be) breakEvens.push(be);
    }
    return { estimates: rows.map((r) => r.estimate), breakEvens };
  });

export interface Pick {
  carId: string;
  optionId: string;
}

export interface ComparisonItem {
  car: Car;
  optionId: string;
  estimate: OwnershipEstimate;
  assumptions: OwnershipAssumptions;
  metrics: Metrics;
  fit: CarFit | null;
}

export interface ComparisonData {
  items: ComparisonItem[];
  assumptions: OwnershipAssumptions;
  hasRequirements: boolean;
}

export const getComparisonData = (picks: Pick[], assumptions: OwnershipAssumptions, req: Requirements | null): Promise<ComparisonData> =>
  simulate(200, (c) => {
    const ctx = buildMetricContext(c.models, assumptions);
    return {
      hasRequirements: req !== null,
      assumptions,
      items: picks.map((p) => {
        const car = find(c, p.carId);
        const o = getOption(car, p.optionId);
        return { car, optionId: o.id, assumptions, estimate: estimateOwnership(car, o, assumptions), metrics: metricsFor(car, o, ctx), fit: req ? evaluateCar(car, req, ctx, o.id) : null };
      }),
    };
  });

export const getDiscoveryOptions = async () => {
  const [{ BRAND_ANY, CHARGING_OPTIONS, OWNERSHIP_OPTIONS, POWERTRAIN_OPTIONS, PREFERENCE_OPTIONS, SEATING_OPTIONS, USAGE_OPTIONS, VEHICLE_TYPE_OPTIONS }, { BUDGET_BOUNDS, KM_BOUNDS }] = await Promise.all([
    import("@/data/discovery-options"),
    import("@/lib/constants"),
  ]);
  return simulate(80, (c) => ({
    vehicleTypes: VEHICLE_TYPE_OPTIONS,
    preferences: PREFERENCE_OPTIONS,
    seating: SEATING_OPTIONS,
    powertrains: POWERTRAIN_OPTIONS,
    usage: USAGE_OPTIONS,
    ownership: OWNERSHIP_OPTIONS,
    charging: CHARGING_OPTIONS,
    brands: [{ value: BRAND_ANY, label: "Any brand" }, ...c.brands.map((b) => ({ value: b.name, label: b.name })).sort((a, b) => a.label.localeCompare(b.label))],
    budget: BUDGET_BOUNDS,
    km: KM_BOUNDS,
  }));
};
