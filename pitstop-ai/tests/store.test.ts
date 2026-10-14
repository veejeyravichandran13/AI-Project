import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/use-app-store";
import { MAX_COMPARE } from "@/lib/constants";
import { catalogue } from "./helpers";
import { COMPARISON_ROWS, bestIndexes } from "@/lib/calculations/comparison";
import { defaultAssumptions, estimateOwnership } from "@/lib/calculations/ownership";
import { buildMetricContext, metricsFor } from "@/lib/catalogue/metrics";
import { defaultOption } from "@/lib/catalogue";
import type { ComparisonItem } from "@/lib/mock-api";

beforeEach(() => useAppStore.setState({ compareIds: [], shortlistIds: [] }));

describe("comparison selection", () => {
  it("caps at five and reports when full", () => {
    const { addToCompare } = useAppStore.getState();
    const results = catalogue.models.slice(0, 7).map((c) => addToCompare(c.id));
    expect(results.filter((r) => r === "added")).toHaveLength(MAX_COMPARE);
    expect(results.filter((r) => r === "full")).toHaveLength(2);
  });
  it("ignores duplicates and supports replace, reorder and remove", () => {
    const s = useAppStore.getState();
    s.addToCompare("a"); s.addToCompare("b"); s.addToCompare("c");
    expect(s.addToCompare("a")).toBe("duplicate");
    s.moveInCompare("c", -1);
    expect(useAppStore.getState().compareIds).toEqual(["a", "c", "b"]);
    s.replaceInCompare("c", "z");
    expect(useAppStore.getState().compareIds).toEqual(["a", "z", "b"]);
    s.removeFromCompare("a");
    expect(useAppStore.getState().compareIds).toEqual(["z", "b"]);
  });
  it("addManyToCompare respects the limit", () => {
    expect(useAppStore.getState().addManyToCompare(["1", "2", "3", "4", "5", "6"])).toEqual({ added: 5, skipped: 1 });
  });
});

describe("comparison table data", () => {
  const A = defaultAssumptions(null);
  const ctx = buildMetricContext(catalogue.models, A);
  const item = (c: (typeof catalogue.models)[number]): ComparisonItem => {
    const o = defaultOption(c);
    return { car: c, optionId: o.id, assumptions: A, estimate: estimateOwnership(c, o, A), metrics: metricsFor(c, o, ctx), fit: null };
  };
  const row = (id: string) => COMPARISON_ROWS.find((r) => r.id === id)!;
  const withBoot = catalogue.models.filter((c) => c.dimensions.bootLitres);
  const noBoot = catalogue.models.find((c) => !c.dimensions.bootLitres)!;

  it("shows 'Not available' for unpublished values and 'Not applicable' for EV-only rows", () => {
    expect(row("boot").cell(item(noBoot)).text).toBe("Not available");
    const ice = catalogue.models.find((c) => defaultOption(c).fuel !== "ev")!;
    expect(row("range").cell(item(ice)).text).toBe("Not applicable");
  });
  it("does not highlight when any value is missing or kinds are mixed", () => {
    expect(bestIndexes(row("boot"), [item(noBoot), item(withBoot[0])]).size).toBe(0);
    const ev = catalogue.models.find((c) => defaultOption(c).fuel === "ev" && row("efficiency").cell(item(c)).numeric !== null)!;
    const ice = catalogue.models.find((c) => defaultOption(c).fuel === "petrol" && defaultOption(c).efficiency)!;
    expect(bestIndexes(row("efficiency"), [item(ev), item(ice)]).size).toBe(0);
  });
  it("highlights the best value when data is complete and comparable", () => {
    const [a, b] = [...withBoot].sort((x, y) => x.dimensions.bootLitres!.v - y.dimensions.bootLitres!.v).filter((c, i, arr) => i === 0 || i === arr.length - 1);
    expect([...bestIndexes(row("boot"), [item(a), item(b)])]).toEqual([1]);
  });
  it("compares energy cost across fuels with shared assumptions", () => {
    const ev = catalogue.models.find((c) => defaultOption(c).fuel === "ev" && item(c).estimate.energyPerKm !== null)!;
    const ice = catalogue.models.find((c) => defaultOption(c).fuel === "petrol" && item(c).estimate.energyPerKm !== null)!;
    expect(bestIndexes(row("per100"), [item(ev), item(ice)]).size).toBe(1);
  });
});
