import type { BodyType, CatalogueFilters, Fuel } from "@/types/car";

const num = (v: string | null) => (v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : undefined);

export type SortKey = "price-asc" | "price-desc" | "power" | "efficiency" | "safety" | "name";

/** Encodes filters into a query string so searches and filtered views are shareable links. */
export function filtersToParams(f: CatalogueFilters, sort?: SortKey): string {
  const p = new URLSearchParams();
  if (f.query) p.set("q", f.query);
  if (f.brands?.length) p.set("brand", f.brands.join(","));
  if (f.bodyTypes?.length) p.set("body", f.bodyTypes.join(","));
  if (f.fuels?.length) p.set("fuel", f.fuels.join(","));
  if (f.minPriceInr !== undefined) p.set("min", String(Math.round(f.minPriceInr / 100000)));
  if (f.maxPriceInr !== undefined) p.set("max", String(Math.round(f.maxPriceInr / 100000)));
  if (f.minSeats) p.set("seats", String(f.minSeats));
  if (f.minNcapStars) p.set("ncap", String(f.minNcapStars));
  if (sort && sort !== "price-asc") p.set("sort", sort);
  return p.toString();
}

export function paramsToFilters(p: URLSearchParams): { filters: CatalogueFilters; sort: SortKey } {
  const min = num(p.get("min"));
  const max = num(p.get("max"));
  return {
    filters: {
      query: p.get("q") ?? undefined,
      brands: list(p.get("brand")),
      bodyTypes: list(p.get("body")) as BodyType[] | undefined,
      fuels: list(p.get("fuel")) as Fuel[] | undefined,
      minPriceInr: min !== undefined ? min * 100000 : undefined,
      maxPriceInr: max !== undefined ? max * 100000 : undefined,
      minSeats: num(p.get("seats")),
      minNcapStars: num(p.get("ncap")),
    },
    sort: (p.get("sort") as SortKey) ?? "price-asc",
  };
}
