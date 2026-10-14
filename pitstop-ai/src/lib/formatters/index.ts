const LAKH = 100000;
const CRORE = 10000000;

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const NOT_AVAILABLE = "Not available";
export const NOT_APPLICABLE = "Not applicable";

/** ₹8,45,000 */
export function formatInr(value: number): string {
  return `₹${inr.format(Math.round(value))}`;
}

/** ₹8.45 lakh / ₹1.02 crore — how Indian buyers read car prices. */
export function formatPriceCompact(rupees: number): string {
  if (rupees >= CRORE) return `₹${num2.format(rupees / CRORE)} crore`;
  return `₹${num2.format(rupees / LAKH)} lakh`;
}

/** Budget slider values are already in lakh. */
export function formatLakh(lakh: number): string {
  if (lakh >= 100) return `₹${num2.format(lakh / 100)} crore`;
  return `₹${num1.format(lakh)} lakh`;
}

export function formatKm(km: number): string {
  return `${inr.format(Math.round(km))} km`;
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}

export function formatYears(years: number): string {
  return years === 1 ? "1 year" : `${num1.format(years)} years`;
}

/** "15 Sep 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return NOT_AVAILABLE;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "₹5.84 – 8.00 lakh" (or crore) for a model's published price range. */
export function formatPriceRange(minInr: number, maxInr: number | null | undefined): string {
  if (!maxInr || maxInr <= minInr) return formatPriceCompact(minInr);
  const crore = maxInr >= CRORE;
  if (minInr >= CRORE === crore) {
    const div = crore ? CRORE : LAKH;
    return `₹${num2.format(minInr / div)} – ${num2.format(maxInr / div)} ${crore ? "crore" : "lakh"}`;
  }
  return `${formatPriceCompact(minInr)} – ${formatPriceCompact(maxInr)}`;
}
