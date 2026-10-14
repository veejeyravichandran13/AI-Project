export type PriceBasis = "ex-showroom" | "on-road";

export interface OwnershipAssumptions {
  stateCode: string; // "" = India-wide indicative
  annualKm: number;
  years: number;
  petrolPerLitre: number;
  dieselPerLitre: number;
  cngPerKg: number;
  homeTariffPerKwh: number;
  publicTariffPerKwh: number;
  /** 0–1: share of EV energy drawn from home charging. */
  homeChargingShare: number;
  /** Real-world efficiency as a fraction of the claimed (test-cycle) figure. */
  realWorldFactor: number;
  priceBasis: PriceBasis;
  onRoadLoadingPct: number;
  /** Servicing and consumables estimate in ₹/km by powertrain family. These are assumptions, not model data. */
  maintenancePerKm: { petrol: number; diesel: number; cng: number; hybrid: number; ev: number };
}

export interface OwnershipEstimate {
  carId: string;
  optionId: string;
  acquisition: number | null;
  acquisitionScope: PriceBasis;
  energyPerKm: number | null;
  annualEnergy: number | null;
  cumulativeEnergy: number | null;
  annualMaintenance: number;
  cumulativeMaintenance: number;
  totalCost: number | null;
  completeness: "full" | "insufficient";
  missing: string[];
  trajectory: { year: number; cumulative: number }[];
}

export interface BreakEven {
  premiumCarId: string;
  baselineCarId: string;
  years: number | null;
  reachedWithinHorizon: boolean;
  statement: string;
}
