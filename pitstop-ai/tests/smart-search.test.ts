import { describe, expect, it } from "vitest";
import { catalogue } from "./helpers";
import { parseSmartSearch } from "@/lib/smart-search";

const parse = (t: string) => parseSmartSearch(t, catalogue.brands, catalogue.models.map((m) => m.model));

describe("smart search parser", () => {
  it("understands seats, fuel, body and a price ceiling", () => {
    const p = parse("7-seater diesel SUV under 20 lakh");
    expect(p.filters.minSeats).toBe(7);
    expect(p.filters.fuels).toEqual(["diesel"]);
    expect(p.filters.bodyTypes).toContain("suv");
    expect(p.filters.maxPriceInr).toBe(2000000);
  });
  it("understands ranges, safety and EV", () => {
    const p = parse("safe EV between 15 and 25 lakh");
    expect(p.filters.fuels).toEqual(["ev"]);
    expect(p.filters.minPriceInr).toBe(1500000);
    expect(p.filters.maxPriceInr).toBe(2500000);
    expect(p.filters.minNcapStars).toBe(4);
  });
  it("understands brands, aliases and crore", () => {
    expect(parse("tata or mahindra SUV under 15 lakh").filters.brands).toEqual(expect.arrayContaining(["Mahindra"]));
    expect(parse("5 star car above 1 crore").filters.minPriceInr).toBe(10000000);
    expect(parse("5 star car").filters.minNcapStars).toBe(5);
  });
  it("treats around as a band and ignores filler words", () => {
    const p = parse("a good hatchback around 8 lakh");
    expect(p.filters.bodyTypes).toEqual(["hatchback"]);
    expect(p.filters.minPriceInr).toBe(640000);
    expect(p.filters.maxPriceInr).toBe(960000);
  });
  it("only keeps leftover words when they name a model", () => {
    expect(parse("something nice").filters.query).toBeUndefined();
    expect(parse("kylaq").filters.query).toBe("kylaq");
  });
});
