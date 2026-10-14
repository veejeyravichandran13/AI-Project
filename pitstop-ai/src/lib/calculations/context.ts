import type { Requirements } from "@/types/recommendation";

export interface BuyerContext {
  label: string;
  reason: string;
}

/**
 * Soft, explainable buyer patterns inferred from the answers. Shown for transparency only; the
 * recommendation engine never ranks on these labels.
 */
export function inferBuyerContext(req: Requirements): BuyerContext[] {
  const out: BuyerContext[] = [];
  if (req.budgetMaxLakh <= 10 && req.minSeats <= 5) out.push({ label: "First-time or budget-aware buyer", reason: "a budget under ₹10 lakh and five seats or fewer" });
  if (req.minSeats >= 6 || (req.preferences.includes("space") && req.preferences.includes("safety"))) out.push({ label: "Family buyer", reason: req.minSeats >= 6 ? `you need ${req.minSeats} seats` : "you prioritised space and safety" });
  if (req.usage === "city") out.push({ label: "Daily commuter", reason: "most of your driving is in the city" });
  if (req.usage === "highway" || req.annualKm >= 18000) out.push({ label: "Highway traveller", reason: req.usage === "highway" ? "you drive mostly on highways" : "you cover a high annual distance" });
  if (req.usage === "rough") out.push({ label: "Rough-road driver", reason: "you drive on rough roads or hills" });
  if (req.preferences.includes("performance")) out.push({ label: "Performance enthusiast", reason: "you asked for performance" });
  if (req.budgetMaxLakh >= 40 || req.preferences.includes("premium")) out.push({ label: "Premium-oriented buyer", reason: req.preferences.includes("premium") ? "you asked for premium positioning" : "your budget reaches the premium range" });
  if (req.powertrain === "ev" || (req.powertrain === "any" && (req.chargingAccess === "home" || req.chargingAccess === "both"))) out.push({ label: "EV-curious buyer", reason: req.powertrain === "ev" ? "you chose electric" : "you have charging access and are open to any powertrain" });
  if (req.preferences.includes("efficiency") || req.ownership === "8+") out.push({ label: "Value-focused, long-term owner", reason: "you care about running costs or plan to keep the car long" });
  return out.slice(0, 4);
}
