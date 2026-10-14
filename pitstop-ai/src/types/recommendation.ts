import type { BodyType, Fuel } from "./car";

/** Priorities map to metrics derived from published specifications; there are no invented ratings. */
export type PreferenceKey = "safety" | "efficiency" | "performance" | "space" | "groundClearance" | "features" | "premium";

export type UsagePattern = "city" | "highway" | "mixed" | "rough";
export type ChargingAccess = "home" | "public" | "both" | "none" | "not-sure";
export type OwnershipBand = "1-3" | "3-5" | "5-8" | "8+";
export type PowertrainChoice = "any" | "petrol" | "diesel" | "cng" | "hybrid" | "ev";

/** Budget is stored in lakh rupees (1 lakh = ₹1,00,000). */
export interface Requirements {
  budgetMinLakh: number;
  budgetMaxLakh: number;
  vehicleType: BodyType | "any";
  preferences: PreferenceKey[];
  minSeats: number;
  powertrain: PowertrainChoice;
  brand: string;
  usage: UsagePattern;
  annualKm: number;
  ownership: OwnershipBand;
  chargingAccess: ChargingAccess;
  stateCode: string;
  city: string;
}

export type FitStrength = "strong" | "good" | "reasonable";

export interface Match {
  rank: number;
  carId: string;
  optionId: string;
  fit: FitStrength;
  /** Internal ordering value; never shown as a percentage. */
  score: number;
  reasons: string[];
  drawbacks: string[];
}

export interface MatchResult {
  matches: Match[];
  shortfallNote: string | null;
  eligibleCount: number;
  excludedCount: number;
  exclusionSummary: string[];
}

export interface CarFit {
  carId: string;
  optionId: string;
  eligible: boolean;
  violations: string[];
  fit: FitStrength;
  score: number;
  reasons: string[];
  drawbacks: string[];
}

export type { Fuel };
