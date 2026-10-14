import { z } from "zod";
import type { Requirements } from "@/types/recommendation";
import { BUDGET_BOUNDS, KM_BOUNDS } from "@/lib/constants";
import { STATES } from "@/data/locations";

const preference = z.enum(["safety", "efficiency", "performance", "space", "groundClearance", "premium"]);

export const requirementsSchema = z
  .object({
    budgetMinLakh: z.number({ error: "Choose a minimum budget" }).min(BUDGET_BOUNDS.minLakh).max(BUDGET_BOUNDS.maxLakh),
    budgetMaxLakh: z.number({ error: "Choose a maximum budget" }).min(BUDGET_BOUNDS.minLakh).max(BUDGET_BOUNDS.maxLakh),
    vehicleType: z.enum(["any", "hatchback", "sedan", "compact-suv", "suv", "mpv", "coupe", "pickup"], { error: "Pick a vehicle type" }),
    preferences: z.array(preference).max(3, "Pick up to three so we can weigh them properly"),
    minSeats: z.number({ error: "Pick a seating requirement" }).int().min(4).max(7),
    powertrain: z.enum(["any", "petrol", "diesel", "cng", "hybrid", "ev"], { error: "Pick a powertrain" }),
    brand: z.string().min(1, "Choose a brand or “Any brand”"),
    usage: z.enum(["city", "highway", "mixed", "rough"], { error: "Pick how you mostly drive" }),
    annualKm: z
      .number({ error: "Enter your yearly distance as a number" })
      .int("Use a whole number of kilometres")
      .min(KM_BOUNDS.min, `Enter at least ${KM_BOUNDS.min.toLocaleString("en-IN")} km a year`)
      .max(KM_BOUNDS.max, `Enter ${KM_BOUNDS.max.toLocaleString("en-IN")} km a year or less`),
    ownership: z.enum(["1-3", "3-5", "5-8", "8+"], { error: "Pick how long you expect to keep the car" }),
    chargingAccess: z.enum(["home", "public", "both", "none", "not-sure"], { error: "Tell us about charging access" }),
    stateCode: z.string(),
    city: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.budgetMinLakh > v.budgetMaxLakh) {
      ctx.addIssue({ code: "custom", path: ["budgetMinLakh"], message: "Minimum budget cannot exceed the maximum" });
    }
    if (v.city && !v.stateCode) {
      ctx.addIssue({ code: "custom", path: ["stateCode"], message: "Choose a state to go with the city, or clear the city" });
    }
    if (v.stateCode && v.city) {
      const s = STATES.find((x) => x.code === v.stateCode);
      if (s && !s.cities.includes(v.city)) {
        ctx.addIssue({ code: "custom", path: ["city"], message: "That city is not listed for the chosen state" });
      }
    }
  });

export type RequirementsInput = z.input<typeof requirementsSchema>;

/** Questionnaire fields grouped by step, used for per-step validation. */
export const STEP_FIELDS: (keyof Requirements)[][] = [
  ["budgetMinLakh", "budgetMaxLakh", "vehicleType"],
  ["minSeats", "powertrain", "chargingAccess"],
  ["preferences", "brand"],
  ["usage", "annualKm", "ownership"],
  ["stateCode", "city"],
];

export function parseRequirements(input: unknown): Requirements | null {
  const r = requirementsSchema.safeParse(input);
  return r.success ? (r.data as Requirements) : null;
}
