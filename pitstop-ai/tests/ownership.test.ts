import { describe, expect, it } from "vitest";
import { anyCar } from "./helpers";
import { computeBreakEven, defaultAssumptions, estimateOwnership, onRoadPrice } from "@/lib/calculations/ownership";
import { getOption } from "@/lib/catalogue";
import type { OwnershipAssumptions } from "@/types/ownership";
import type { Car } from "@/types/car";

const A = (patch: Partial<OwnershipAssumptions> = {}): OwnershipAssumptions => ({
  ...defaultAssumptions(null),
  annualKm: 10000, years: 5, petrolPerLitre: 100, dieselPerLitre: 90, cngPerKg: 80, homeTariffPerKwh: 8, publicTariffPerKwh: 20, homeChargingShare: 1, realWorldFactor: 1,
  maintenancePerKm: { petrol: 0.5, diesel: 0.5, cng: 0.5, hybrid: 0.5, ev: 0.25 },
  ...patch,
});
const withEff = (c: Car) => c.options.find((o) => o.efficiency && o.fuel === "petrol")!;
const evCar = () => anyCar((c) => c.options.some((o) => o.fuel === "ev" && o.ev?.batteryKwh && o.ev?.claimedRangeKm));
const est = (c: Car, optId: string, a: OwnershipAssumptions) => estimateOwnership(c, getOption(c, optId), a);

describe("ownership estimates", () => {
  it("computes ICE energy cost from claimed efficiency", () => {
    const c = anyCar((x) => x.options.some((o) => o.efficiency && o.fuel === "petrol"));
    const o = withEff(c);
    const e = est(c, o.id, A());
    expect(e.annualEnergy).toBe(Math.round((100 / o.efficiency!.value) * 10000));
    expect(e.cumulativeEnergy).toBe(Math.round((100 / o.efficiency!.value) * 10000 * 5));
    expect(est(c, o.id, A({ realWorldFactor: 0.5 })).annualEnergy!).toBeGreaterThan(e.annualEnergy! * 1.9);
  });

  it("derives EV energy from range ÷ battery and blends tariffs", () => {
    const c = evCar();
    const o = c.options.find((x) => x.fuel === "ev" && x.ev?.batteryKwh && x.ev?.claimedRangeKm)!;
    const home = est(c, o.id, A({ homeChargingShare: 1 }));
    const pub = est(c, o.id, A({ homeChargingShare: 0 }));
    const mix = est(c, o.id, A({ homeChargingShare: 0.5 }));
    expect(home.energyPerKm!).toBeCloseTo(8 / (o.ev!.claimedRangeKm!.v / o.ev!.batteryKwh!.v), 6);
    expect(mix.annualEnergy!).toBeGreaterThan(home.annualEnergy!);
    expect(mix.annualEnergy!).toBeLessThan(pub.annualEnergy!);
  });

  it("uses one price basis when switching to on-road", () => {
    const c = anyCar((x) => x.options.some((o) => o.efficiency));
    const o = c.options.find((x) => x.efficiency)!;
    const ex = est(c, o.id, A());
    const on = est(c, o.id, A({ priceBasis: "on-road", onRoadLoadingPct: 20 }));
    expect(on.acquisition).toBe(onRoadPrice(ex.acquisition!, 20));
    expect(on.acquisitionScope).toBe("on-road");
  });

  it("refuses to estimate when efficiency is not published", () => {
    const c = structuredClone(anyCar((x) => x.options.some((o) => o.efficiency && o.fuel === "petrol")));
    const o = c.options.find((x) => x.efficiency)!;
    o.efficiency = null;
    const e = est(c, o.id, A());
    expect(e.completeness).toBe("insufficient");
    expect(e.totalCost).toBeNull();
    expect(e.missing.join(" ")).toMatch(/efficiency/i);
  });

  it("flags when an engine's own price is unpublished and uses the model price", () => {
    const c = structuredClone(anyCar((x) => x.options.some((o) => o.efficiency)));
    const o = c.options.find((x) => x.efficiency)!;
    o.fromPriceInr = null;
    const e = est(c, o.id, A());
    expect(e.acquisition).toBe(c.price.minInr.v);
    expect(e.missing.join(" ")).toMatch(/unpublished/i);
  });

  it("falls back to India-wide defaults without a state", () => {
    expect(defaultAssumptions(null).stateCode).toBe("");
  });
});

describe("break-even", () => {
  const mk = (c: Car, optId: string, a = A()) => ({ name: c.model, estimate: est(c, optId, a) });

  it("claims no saving when the pricier car also costs more to run", () => {
    const small = anyCar((c) => c.price.minInr.v < 800000 && c.options.some((o) => o.efficiency && o.fuel === "petrol"));
    const big = anyCar((c) => c.price.minInr.v > 6000000 && c.options.some((o) => o.efficiency && o.fuel !== "ev"));
    const so = small.options.find((o) => o.efficiency && o.fuel === "petrol")!;
    const bo = big.options.find((o) => o.efficiency && o.fuel !== "ev")!;
    const be = computeBreakEven(mk(small, so.id), mk(big, bo.id));
    expect(be?.reachedWithinHorizon).toBe(false);
    expect(be?.years).toBeNull();
  });

  it("says not enough information when an input is missing", () => {
    const a = anyCar((c) => c.options.some((o) => o.efficiency && o.fuel === "petrol"));
    const ao = a.options.find((o) => o.efficiency && o.fuel === "petrol")!;
    const x = mk(a, ao.id);
    const y = { ...mk(a, ao.id), estimate: { ...mk(a, ao.id).estimate, completeness: "insufficient" as const } };
    expect(computeBreakEven(x, y)!.statement).toMatch(/not enough information/i);
  });

  it("returns nothing when price bases differ", () => {
    const c = anyCar((x) => x.options.some((o) => o.efficiency && o.fuel === "petrol"));
    const o = c.options.find((x) => x.efficiency && x.fuel === "petrol")!;
    const d = anyCar((x) => x.id !== c.id && x.options.some((q) => q.efficiency && q.fuel === "petrol"));
    const dop = d.options.find((x) => x.efficiency && x.fuel === "petrol")!;
    expect(computeBreakEven(mk(c, o.id), mk(d, dop.id, A({ priceBasis: "on-road" })))).toBeNull();
  });
});
