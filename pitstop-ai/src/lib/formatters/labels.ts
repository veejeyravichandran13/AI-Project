import type { Requirements } from "@/types/recommendation";
import {
  BRAND_ANY,
  CHARGING_OPTIONS,
  OWNERSHIP_OPTIONS,
  POWERTRAIN_OPTIONS,
  PREFERENCE_OPTIONS,
  SEATING_OPTIONS,
  USAGE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "@/data/discovery-options";
import { findState } from "@/data/locations";
import { formatKm, formatLakh } from "./index";

const label = <T extends string | number>(opts: { value: T; label: string }[], v: T) =>
  opts.find((o) => o.value === v)?.label ?? String(v);

export interface SummaryItem {
  id: string;
  step: number;
  title: string;
  value: string;
  note?: string;
}

/** Human-readable summary of a requirements object, grouped by the questionnaire step that owns it. */
export function summariseRequirements(r: Requirements): SummaryItem[] {
  const state = r.stateCode ? findState(r.stateCode) : undefined;
  const evPossible = r.powertrain === "ev" || r.powertrain === "any";
  return [
    { id: "budget", step: 0, title: "Budget", value: `${formatLakh(r.budgetMinLakh)} to ${formatLakh(r.budgetMaxLakh)} ex-showroom` },
    { id: "type", step: 0, title: "Vehicle type", value: label(VEHICLE_TYPE_OPTIONS, r.vehicleType) },
    { id: "seats", step: 1, title: "Seating", value: `At least ${label(SEATING_OPTIONS, r.minSeats).toLowerCase()}` },
    { id: "powertrain", step: 1, title: "Powertrain", value: label(POWERTRAIN_OPTIONS, r.powertrain) },
    ...(evPossible ? [{ id: "charging", step: 1, title: "Charging access", value: label(CHARGING_OPTIONS, r.chargingAccess) }] : []),
    {
      id: "prefs",
      step: 2,
      title: "What matters most",
      value: r.preferences.length ? r.preferences.map((p) => label(PREFERENCE_OPTIONS, p)).join(", ") : "No specific priorities (balanced view)",
    },
    { id: "brand", step: 2, title: "Brand", value: r.brand === BRAND_ANY ? "Any brand" : `${r.brand} (preferred where it fits)` },
    { id: "usage", step: 3, title: "Driving", value: label(USAGE_OPTIONS, r.usage) },
    { id: "km", step: 3, title: "Distance", value: `${formatKm(r.annualKm)} a year` },
    { id: "own", step: 3, title: "Ownership period", value: label(OWNERSHIP_OPTIONS, r.ownership) },
    {
      id: "loc",
      step: 4,
      title: "Location",
      value: state ? `${r.city ? `${r.city}, ` : ""}${state.name}` : "Not shared",
      note: state ? undefined : "We will use India-wide indicative estimates for fuel, power and on-road costs.",
    },
  ];
}
