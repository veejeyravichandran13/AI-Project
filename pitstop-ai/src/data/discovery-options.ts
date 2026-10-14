import type {
  ChargingAccess,
  OwnershipBand,
  PowertrainChoice,
  PreferenceKey,
  Requirements,
  UsagePattern,
} from "@/types/recommendation";
import type { BodyType } from "@/types/car";
import { STATES } from "./locations";

export interface Option<T extends string | number = string> {
  value: T;
  label: string;
  hint?: string;
}

export const VEHICLE_TYPE_OPTIONS: Option<BodyType | "any">[] = [
  { value: "any", label: "Open to any body type", hint: "Let the guide suggest what fits" },
  { value: "hatchback", label: "Hatchback", hint: "Compact, easy to park" },
  { value: "sedan", label: "Sedan", hint: "Boot space and a smooth highway ride" },
  { value: "compact-suv", label: "Compact SUV", hint: "Higher seating, city-friendly size" },
  { value: "suv", label: "SUV", hint: "Larger, taller, more commanding" },
  { value: "mpv", label: "MPV / people mover", hint: "Built around space and seating" },
  { value: "coupe", label: "Coupe / sports", hint: "Two-door or sporty body styles" },
  { value: "pickup", label: "Pickup", hint: "Load-carrying utility" },
];

/** Priorities map onto metrics computed from published figures (NCAP stars, claimed efficiency, power, dimensions). */
export const PREFERENCE_OPTIONS: Option<PreferenceKey>[] = [
  { value: "safety", label: "Crash-test safety", hint: "Uses published NCAP star ratings" },
  { value: "efficiency", label: "Low running cost", hint: "Uses claimed efficiency and fuel prices" },
  { value: "performance", label: "Power and performance", hint: "Uses published power output" },
  { value: "space", label: "Space and practicality", hint: "Uses boot size, wheelbase and seats" },
  { value: "groundClearance", label: "Ground clearance", hint: "Uses published clearance in mm" },
  { value: "premium", label: "Premium positioning", hint: "Price-based proxy" },
];

export const SEATING_OPTIONS: Option<number>[] = [
  { value: 4, label: "Up to 4 people" },
  { value: 5, label: "5 people" },
  { value: 6, label: "6 people" },
  { value: 7, label: "7 people" },
];

export const POWERTRAIN_OPTIONS: Option<PowertrainChoice>[] = [
  { value: "any", label: "Open to any" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "hybrid", label: "Hybrid (mild or strong)" },
  { value: "ev", label: "Electric (EV)" },
];

export const USAGE_OPTIONS: Option<UsagePattern>[] = [
  { value: "city", label: "Mostly city", hint: "Short trips, traffic, parking" },
  { value: "highway", label: "Mostly highway", hint: "Frequent long drives" },
  { value: "mixed", label: "A healthy mix", hint: "City during the week, highway on weekends" },
  { value: "rough", label: "Rough roads or hills", hint: "Broken tarmac, ghats, unpaved stretches" },
];

export const OWNERSHIP_OPTIONS: Option<OwnershipBand>[] = [
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-8", label: "5–8 years" },
  { value: "8+", label: "8+ years" },
];

export const CHARGING_OPTIONS: Option<ChargingAccess>[] = [
  { value: "home", label: "Home charging available", hint: "Dedicated parking with a socket or wallbox" },
  { value: "both", label: "Home and public charging" },
  { value: "public", label: "Public charging only" },
  { value: "none", label: "No reliable charging access" },
  { value: "not-sure", label: "Not sure yet" },
];

export const BRAND_ANY = "any";

export const DEFAULT_REQUIREMENTS: Requirements = {
  budgetMinLakh: 6,
  budgetMaxLakh: 16,
  vehicleType: "any",
  preferences: [],
  minSeats: 5,
  powertrain: "any",
  brand: BRAND_ANY,
  usage: "mixed",
  annualKm: 12000,
  ownership: "3-5",
  chargingAccess: "not-sure",
  stateCode: "",
  city: "",
};

/** Realistic sample answers used for the landing-page preview and fixtures. */
export const SAMPLE_REQUIREMENTS: Requirements = {
  budgetMinLakh: 10,
  budgetMaxLakh: 22,
  vehicleType: "any",
  preferences: ["safety", "space"],
  minSeats: 5,
  powertrain: "any",
  brand: BRAND_ANY,
  usage: "mixed",
  annualKm: 14000,
  ownership: "5-8",
  chargingAccess: "not-sure",
  stateCode: "MH",
  city: "Pune",
};

export const STATE_OPTIONS: Option[] = STATES.map((s) => ({ value: s.code, label: s.name }));
