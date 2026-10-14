import type { BodyType, Brand, CatalogueFilters, Fuel } from "@/types/car";

export interface ParsedSearch {
  filters: CatalogueFilters;
  /** Human-readable chips describing what was understood, shown back to the user. */
  understood: string[];
  /** Words we could not map to a filter. */
  leftover: string;
}

const LAKH = 100000;
const CRORE = 10000000;
const WORD_NUM: Record<string, number> = { four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

const BODY: [RegExp, BodyType, string][] = [
  [/\bcompact[- ]?suvs?\b|\bsub[- ]?4\s?m\b/, "compact-suv", "Compact SUV"],
  [/\bsuvs?\b/, "suv", "SUV"],
  [/\bsedans?\b/, "sedan", "Sedan"],
  [/\bhatch(?:back)?s?\b/, "hatchback", "Hatchback"],
  [/\bmpvs?\b|\bmuvs?\b|\bpeople ?mover\b/, "mpv", "MPV"],
  [/\bpick-?ups?\b|\btrucks?\b/, "pickup", "Pickup"],
  [/\bcoupes?\b|\bsports? car\b/, "coupe", "Coupe"],
];

const FUEL: [RegExp, Fuel, string][] = [
  [/\bdiesels?\b/, "diesel", "Diesel"],
  [/\bpetrol\b|\bgasoline\b/, "petrol", "Petrol"],
  [/\bcng\b/, "cng", "CNG"],
  [/\belectric\b|\bevs?\b|\bbattery\b/, "ev", "Electric"],
  [/\bstrong[- ]hybrid\b/, "strong-hybrid", "Strong hybrid"],
  [/\bhybrids?\b/, "mild-hybrid", "Hybrid"],
];

const ALIASES: Record<string, string> = { maruti: "Maruti Suzuki", suzuki: "Maruti Suzuki", vw: "Volkswagen", merc: "Mercedes-Benz", mercedes: "Mercedes-Benz", benz: "Mercedes-Benz", skoda: "Škoda", tata: "Tata Motors", land: "Land Rover" };

function toRupees(n: number, unit: string | undefined): number {
  if (unit && /^cr/.test(unit)) return n * CRORE;
  return n * LAKH; // "lakh", "l", "lac" and a bare number all read as lakh
}

/**
 * A rules-based natural-language parser. It runs entirely in the browser (no model, no network) and
 * handles phrases like "7 seater diesel SUV under 20 lakh" or "safe EV between 15 and 25 lakh".
 */
export function parseSmartSearch(text: string, brands: Brand[], modelNames: string[] = []): ParsedSearch {
  let t = ` ${text.toLowerCase().replace(/₹|rs\.?/g, " ").replace(/,/g, "")} `;
  const filters: CatalogueFilters = {};
  const understood: string[] = [];
  const eat = (re: RegExp) => {
    t = t.replace(re, " ");
  };

  // Price: "between 10 and 15 lakh", "10-15 lakh", "under 20 lakh", "around 12 lakh", "1 crore"
  const range = t.match(/(?:between\s+)?(\d+(?:\.\d+)?)\s*(?:-|to|and)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)\b/);
  const under = t.match(/(?:under|below|within|upto|up to|less than|max(?:imum)?|budget(?: of)?)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?\b/);
  const over = t.match(/(?:above|over|more than|at least|minimum)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)\b/);
  const around = t.match(/(?:around|about|approx(?:imately)?|near)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?\b/);
  const fmt = (r: number) => (r >= CRORE ? `₹${+(r / CRORE).toFixed(2)} crore` : `₹${+(r / LAKH).toFixed(1)} lakh`);
  if (range) {
    const unit = range[3];
    filters.minPriceInr = toRupees(Number(range[1]), unit);
    filters.maxPriceInr = toRupees(Number(range[2]), unit);
    understood.push(`${fmt(filters.minPriceInr)} to ${fmt(filters.maxPriceInr)}`);
    eat(range[0] ? new RegExp(range[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : /$^/);
  } else if (under) {
    filters.maxPriceInr = toRupees(Number(under[1]), under[2]);
    understood.push(`Under ${fmt(filters.maxPriceInr)}`);
    eat(new RegExp(under[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } else if (over) {
    filters.minPriceInr = toRupees(Number(over[1]), over[2]);
    understood.push(`Above ${fmt(filters.minPriceInr)}`);
    eat(new RegExp(over[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } else if (around) {
    const c = toRupees(Number(around[1]), around[2]);
    filters.minPriceInr = Math.round(c * 0.8);
    filters.maxPriceInr = Math.round(c * 1.2);
    understood.push(`Around ${fmt(c)}`);
    eat(new RegExp(around[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  // Seats
  const seats = t.match(/\b(\d|four|five|six|seven|eight|nine)[- ]?(?:seater|seat|seats|seats?er)\b/);
  if (seats) {
    const n = WORD_NUM[seats[1]] ?? Number(seats[1]);
    if (n >= 2 && n <= 9) {
      filters.minSeats = n;
      understood.push(`${n}+ seats`);
    }
    eat(new RegExp(seats[0]));
  }

  // Safety
  if (/\b5[- ]?star\b|\bfive[- ]?star\b/.test(t)) {
    filters.minNcapStars = 5;
    understood.push("5-star NCAP");
    eat(/\b(?:5|five)[- ]?star(?:s)?\b/);
  } else if (/\bsafe(?:st|r)?\b|\bsafety\b/.test(t)) {
    filters.minNcapStars = 4;
    understood.push("4+ star NCAP");
    eat(/\bsafe(?:st|r)?\b|\bsafety\b/);
  }

  const bodyTypes: BodyType[] = [];
  for (const [re, v, label] of BODY) {
    if (re.test(t)) {
      bodyTypes.push(v);
      understood.push(label);
      eat(re);
      if (v === "compact-suv") break;
    }
  }
  if (bodyTypes.length) filters.bodyTypes = bodyTypes;

  const fuels: Fuel[] = [];
  for (const [re, v, label] of FUEL) {
    if (re.test(t)) {
      fuels.push(v);
      understood.push(label);
      eat(re);
    }
  }
  if (fuels.length) filters.fuels = fuels;

  // Brands (by name or alias)
  const found: string[] = [];
  for (const b of brands) {
    const names = [b.name.toLowerCase(), b.slug.replace(/-/g, " "), b.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()];
    if (names.some((n) => t.includes(` ${n} `))) {
      found.push(b.name);
      names.forEach((n) => eat(new RegExp(` ${n} `, "g")));
    }
  }
  for (const [alias, name] of Object.entries(ALIASES)) {
    const b = brands.find((x) => x.name === name);
    if (b && !found.includes(b.name) && t.includes(` ${alias} `)) {
      found.push(b.name);
      eat(new RegExp(` ${alias} `, "g"));
    }
  }
  if (found.length) {
    filters.brands = found;
    understood.push(...found);
  }

  // Remaining text only counts if it names a model, so filler words never empty the results.
  const leftover = t.replace(/\b(?:a|an|the|for|with|in|me|show|find|i|want|need|car|cars|good|best|new|looking|that|is|to|and|or|of)\b/g, " ").replace(/\s+/g, " ").trim();
  if (leftover) {
    const hit = modelNames.find((m) => leftover.includes(m.toLowerCase()));
    if (hit) filters.query = leftover;
  }
  return { filters, understood, leftover: filters.query ? "" : leftover };
}
