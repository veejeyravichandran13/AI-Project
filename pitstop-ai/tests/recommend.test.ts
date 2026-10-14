import { describe, expect, it } from "vitest";
import { catalogue, ctxFor, req } from "./helpers";
import { evaluateCar, recommend } from "@/lib/calculations/recommend";
import { filterCars, fuelFamily, getOption, optionPriceRange } from "@/lib/catalogue";

const LAKH = 100000;

describe("recommendations on the real catalogue", () => {
  it("returns five matches with five reasons each for a broad brief", () => {
    const r = req({ budgetMinLakh: 8, budgetMaxLakh: 25, minSeats: 5, preferences: ["safety", "space"] });
    const out = recommend(catalogue.models, r, ctxFor(r));
    expect(out.matches).toHaveLength(5);
    for (const m of out.matches) {
      expect(m.reasons).toHaveLength(5);
      expect(m.drawbacks.length).toBeGreaterThan(0);
    }
    expect(out.shortfallNote).toBeNull();
  });

  it("never violates hard constraints to fill the list", () => {
    const r = req({ budgetMinLakh: 8, budgetMaxLakh: 20, minSeats: 7, powertrain: "diesel", vehicleType: "suv" });
    const out = recommend(catalogue.models, r, ctxFor(r));
    for (const m of out.matches) {
      const c = catalogue.models.find((x) => x.id === m.carId)!;
      const o = getOption(c, m.optionId);
      const p = optionPriceRange(c, o);
      expect(c.seats.v).toBeGreaterThanOrEqual(7);
      expect(c.bodyType).toBe("suv");
      expect(o.fuel).toBe("diesel");
      if (p.exact) {
        expect(p.min).toBeGreaterThanOrEqual(8 * LAKH);
        expect(p.min).toBeLessThanOrEqual(20 * LAKH);
      }
    }
  });

  it("explains a shortfall instead of padding", () => {
    const r = req({ budgetMinLakh: 3, budgetMaxLakh: 4, minSeats: 7, powertrain: "ev" });
    const out = recommend(catalogue.models, r, ctxFor(r));
    expect(out.matches.length).toBeLessThan(5);
    expect(out.shortfallNote).toBeTruthy();
    expect(out.exclusionSummary.length).toBeGreaterThan(0);
  });

  it("excludes EVs when the buyer has no charging access and is open to any fuel", () => {
    const r = req({ chargingAccess: "none", budgetMinLakh: 3, budgetMaxLakh: 40 });
    const out = recommend(catalogue.models, r, ctxFor(r));
    for (const m of out.matches) expect(getOption(catalogue.models.find((x) => x.id === m.carId)!, m.optionId).fuel).not.toBe("ev");
  });

  it("treats hybrids as a family", () => {
    const r = req({ powertrain: "hybrid", budgetMaxLakh: 120 });
    const out = recommend(catalogue.models, r, ctxFor(r));
    for (const m of out.matches) expect(fuelFamily(getOption(catalogue.models.find((x) => x.id === m.carId)!, m.optionId).fuel)).toBe("hybrid");
  });

  it("is deterministic", () => {
    const r = req({ budgetMaxLakh: 20, preferences: ["efficiency"] });
    expect(recommend(catalogue.models, r, ctxFor(r))).toEqual(recommend(catalogue.models, r, ctxFor(r)));
  });

  it("flags out-of-brief cars with violations on the detail page", () => {
    const pricey = [...catalogue.models].sort((a, b) => b.price.minInr.v - a.price.minInr.v)[0];
    const r = req({ budgetMaxLakh: 10 });
    const fit = evaluateCar(pricey, r, ctxFor(r));
    expect(fit.eligible).toBe(false);
    expect(fit.violations.length).toBeGreaterThan(0);
  });

  it("never invents safety strengths for cars without an NCAP rating", () => {
    const r = req({ preferences: ["safety"], budgetMaxLakh: 40 });
    const out = recommend(catalogue.models, r, ctxFor(r));
    for (const m of out.matches) {
      const c = catalogue.models.find((x) => x.id === m.carId)!;
      if (!c.safety.ncap) expect(m.reasons.join(" ")).not.toMatch(/-star .*NCAP/);
    }
  });
});

describe("catalogue filtering", () => {
  it("filters by fuel, body and price", () => {
    const evs = filterCars(catalogue.models, { fuels: ["ev"] });
    expect(evs.length).toBeGreaterThan(0);
    expect(evs.every((c) => c.options.some((o) => o.fuel === "ev"))).toBe(true);
    const suvs = filterCars(catalogue.models, { bodyTypes: ["suv"], maxPriceInr: 20 * LAKH });
    expect(suvs.every((c) => c.bodyType === "suv" && c.price.minInr.v <= 20 * LAKH)).toBe(true);
  });
  it("filters by NCAP stars and seats", () => {
    expect(filterCars(catalogue.models, { minNcapStars: 5 }).every((c) => (c.safety.ncap?.stars ?? 0) >= 5)).toBe(true);
    expect(filterCars(catalogue.models, { minSeats: 7 }).every((c) => c.seats.v >= 7)).toBe(true);
  });
  it("searches by name", () => {
    const hits = filterCars(catalogue.models, { query: "kylaq" });
    expect(hits.map((c) => c.model)).toContain("Kylaq");
  });
});
