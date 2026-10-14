import type { BodyType, Car, CarImage, Fuel, Option, Segment } from "@/types/car";

export type FuelFamily = "petrol" | "diesel" | "cng" | "hybrid" | "ev";

export const fuelFamily = (f: Fuel): FuelFamily => (f === "mild-hybrid" || f === "strong-hybrid" ? "hybrid" : f);

export const FUEL_LABEL: Record<Fuel, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  "mild-hybrid": "Mild hybrid",
  "strong-hybrid": "Strong hybrid",
  ev: "Electric",
};

export const BODY_LABEL: Record<BodyType, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  "compact-suv": "Compact SUV",
  suv: "SUV",
  mpv: "MPV",
  coupe: "Coupe",
  pickup: "Pickup",
};

export const SEGMENT_LABEL: Record<Segment, string> = { budget: "Budget", mainstream: "Mainstream", premium: "Premium", luxury: "Luxury" };

export const carName = (c: Pick<Car, "brand" | "model">) => `${c.brand} ${c.model}`;
export const carMinPrice = (c: Car) => c.price.minInr.v;
export const carMaxPrice = (c: Car) => c.price.maxInr?.v ?? c.price.minInr.v;
export const fuelsOf = (c: Car): Fuel[] => [...new Set(c.options.map((o) => o.fuel))];
export const fuelFamiliesOf = (c: Car): FuelFamily[] => [...new Set(c.options.map((o) => fuelFamily(o.fuel)))];
export const seatsOf = (c: Car) => c.seats.v;
export const leadImage = (c: Car): CarImage | null => c.images[0] ?? null;
export const ncapStars = (c: Car): number | null => c.safety.ncap?.stars ?? null;

/** Price-based bands. These are derived labels, not manufacturer classifications. */
export function segmentOf(c: Car): Segment {
  const p = carMinPrice(c);
  if (p < 800000) return "budget";
  if (p < 2000000) return "mainstream";
  if (p < 5000000) return "premium";
  return "luxury";
}

/** Price of an option: its own published price if known, otherwise the model's range. */
export function optionPriceRange(c: Car, o: Option): { min: number; max: number; exact: boolean } {
  const own = o.fromPriceInr?.v;
  if (own !== undefined) return { min: own, max: own, exact: true };
  return { min: carMinPrice(c), max: carMaxPrice(c), exact: false };
}

/** Default option to feature: the cheapest one with a published price, else the first. */
export function defaultOption(c: Car): Option {
  const priced = c.options.filter((o) => o.fromPriceInr).sort((a, b) => a.fromPriceInr!.v - b.fromPriceInr!.v);
  return priced[0] ?? c.options[0];
}

export function getOption(c: Car, optionId?: string | null): Option {
  return c.options.find((o) => o.id === optionId) ?? defaultOption(c);
}

export function powerRange(c: Car): { min: number; max: number } | null {
  const ps = c.options.map((o) => o.powerPs?.v).filter((v): v is number => typeof v === "number");
  return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
}

export function evRangeKm(o: Option): number | null {
  return o.ev?.claimedRangeKm?.v ?? null;
}

export function bestEvRange(c: Car): number | null {
  const r = c.options.map(evRangeKm).filter((v): v is number => v !== null);
  return r.length ? Math.max(...r) : null;
}

export function efficiencyLabel(o: Option): string | null {
  if (o.fuel === "ev") {
    const r = o.ev?.claimedRangeKm?.v;
    return r ? `${r} km claimed range` : null;
  }
  return o.efficiency ? `${o.efficiency.value} ${o.efficiency.unit}` : null;
}

export function sourceFor(c: Car, id: string) {
  return c.sources.find((s) => s.id === id);
}

export function filterCars(cars: Car[], f: import("@/types/car").CatalogueFilters = {}): Car[] {
  const q = f.query?.trim().toLowerCase();
  return cars.filter((c) => {
    if (q && !`${c.brand} ${c.model} ${BODY_LABEL[c.bodyType]}`.toLowerCase().includes(q)) return false;
    if (f.brands?.length && !f.brands.includes(c.brand)) return false;
    if (f.bodyTypes?.length && !f.bodyTypes.includes(c.bodyType)) return false;
    if (f.fuels?.length && !c.options.some((o) => f.fuels!.includes(o.fuel) || (f.fuels!.includes("mild-hybrid") && o.fuel === "strong-hybrid"))) return false;
    if (f.minPriceInr !== undefined && carMaxPrice(c) < f.minPriceInr) return false;
    if (f.maxPriceInr !== undefined && carMinPrice(c) > f.maxPriceInr) return false;
    if (f.minSeats && seatsOf(c) < f.minSeats) return false;
    if (f.minNcapStars && (ncapStars(c) ?? 0) < f.minNcapStars) return false;
    return true;
  });
}

export type BrandTier = "mass" | "premium" | "exotic";

export const BRAND_TIER_LABEL: Record<BrandTier, { title: string; blurb: string }> = {
  mass: { title: "Popular in India", blurb: "Everyday brands with models starting under ₹20 lakh." },
  premium: { title: "Premium and luxury", blurb: "Models starting from ₹20 lakh up to ₹1 crore." },
  exotic: { title: "Exotic and ultra-luxury", blurb: "Models starting above ₹1 crore." },
};

/** Price-based tiers (derived from the cheapest model), so Maruti, Tata, Hyundai and similar lead the list. */
export function brandTier(cheapestInr: number): BrandTier {
  return cheapestInr < 2000000 ? "mass" : cheapestInr < 10000000 ? "premium" : "exotic";
}
