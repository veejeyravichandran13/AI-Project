import type { Car, Option } from "@/types/car";
import type { CarFit, FitStrength, Match, MatchResult, PreferenceKey, Requirements, UsagePattern } from "@/types/recommendation";
import { BRAND_ANY } from "@/data/discovery-options";
import { BUDGET_BOUNDS, OWNERSHIP_YEARS } from "@/lib/constants";
import { BODY_LABEL, FUEL_LABEL, fuelFamily, optionPriceRange, seatsOf } from "@/lib/catalogue";
import { metricsFor, type MetricContext, type Metrics } from "@/lib/catalogue/metrics";
import { energyPerKm } from "./ownership";
import { formatInr, formatLakh, formatNumber } from "@/lib/formatters";

const LAKH = 100000;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const USAGE_LABEL: Record<UsagePattern, string> = {
  city: "city driving",
  highway: "highway driving",
  mixed: "mixed city and highway driving",
  rough: "rough roads and hills",
};

function activePreferences(req: Requirements): PreferenceKey[] {
  const prefs = [...req.preferences];
  if (req.annualKm >= 18000 && !prefs.includes("efficiency")) prefs.push("efficiency");
  return prefs;
}

/** Unknown metrics count as a cautious middle-low value, never as a strength. */
const val = (m: number | null, fallback = 4) => (m === null ? fallback : m);

function prefValue(m: Metrics, p: PreferenceKey): number | null {
  return p === "safety" ? m.safety : p === "efficiency" ? m.efficiency : p === "performance" ? m.performance : p === "space" ? m.space : p === "groundClearance" ? m.groundClearance : m.premium;
}

function usageScore(m: Metrics, usage: UsagePattern): number {
  const city = 0.55 * val(m.efficiency, 5) + 0.45 * val(m.compactness, 5);
  const highway = 0.4 * val(m.performance, 5) + 0.35 * val(m.safety, 4) + 0.25 * val(m.space, 5);
  switch (usage) {
    case "city": return city;
    case "highway": return highway;
    case "mixed": return (city + highway) / 2;
    case "rough": return 0.7 * val(m.groundClearance, 4) + 0.3 * val(m.safety, 4);
  }
}

const matchesPowertrain = (o: Option, req: Requirements) =>
  req.powertrain === "any" ||
  (req.powertrain === "hybrid" ? fuelFamily(o.fuel) === "hybrid" : o.fuel === req.powertrain || fuelFamily(o.fuel) === req.powertrain);

function optionOk(car: Car, o: Option, req: Requirements): boolean {
  if (!matchesPowertrain(o, req)) return false;
  if (req.powertrain === "any" && req.chargingAccess === "none" && o.fuel === "ev") return false;
  const r = optionPriceRange(car, o);
  const lo = req.budgetMinLakh * LAKH;
  const hi = req.budgetMaxLakh >= BUDGET_BOUNDS.maxLakh ? Infinity : req.budgetMaxLakh * LAKH; // the slider's top end means “₹3 crore and above”
  return r.exact ? r.min >= lo && r.min <= hi : r.max >= lo && r.min <= hi; // unpublished: overlap with the model's range
}

function carViolations(car: Car, req: Requirements): string[] {
  const out: string[] = [];
  if (seatsOf(car) < req.minSeats) out.push(`Seats ${seatsOf(car)}, but you need ${req.minSeats}`);
  if (req.vehicleType !== "any" && car.bodyType !== req.vehicleType) out.push(`It is a ${BODY_LABEL[car.bodyType].toLowerCase()}, not the ${BODY_LABEL[req.vehicleType].toLowerCase()} you asked for`);
  const pt = car.options.filter((o) => matchesPowertrain(o, req));
  if (pt.length === 0) out.push(`Not offered with your chosen powertrain`);
  else if (req.powertrain === "any" && req.chargingAccess === "none" && pt.every((o) => o.fuel === "ev")) out.push("Electric only, and you have no reliable charging access");
  else if (!pt.some((o) => optionOk(car, o, req))) {
    const lo = Math.min(...pt.map((o) => optionPriceRange(car, o).min));
    const hi = Math.max(...pt.map((o) => optionPriceRange(car, o).max));
    out.push(`No matching engine between ${formatLakh(req.budgetMinLakh)} and ${formatLakh(req.budgetMaxLakh)} (matching engines run ${formatLakh(lo / LAKH)} to ${formatLakh(hi / LAKH)})`);
  }
  return out;
}

function scoreOption(car: Car, o: Option, req: Requirements, ctx: MetricContext): number {
  const m = metricsFor(car, o, ctx);
  const prefs = activePreferences(req);
  const prefsScore = prefs.length ? mean(prefs.map((p) => val(prefValue(m, p)))) : mean([val(m.safety), val(m.efficiency, 5), val(m.space, 5), val(m.performance, 5)]);
  const price = optionPriceRange(car, o).min;
  const span = Math.max(1, (req.budgetMaxLakh - req.budgetMinLakh) * LAKH);
  const frac = Math.min(1, Math.max(0, (price - req.budgetMinLakh * LAKH) / span));
  const budget = 10 - 4 * frac;
  const years = OWNERSHIP_YEARS[req.ownership] ?? 5;
  const ownership = years >= 6 ? mean([val(m.safety), val(m.efficiency, 5)]) : mean([val(m.efficiency, 5), val(m.performance, 5)]);
  const seatFit = req.minSeats >= 6 ? val(m.space, 5) : (val(m.space, 5) + 7) / 2;
  const brand = req.brand !== BRAND_ANY && car.brand === req.brand ? 0.8 : 0;
  return 0.4 * prefsScore + 0.22 * usageScore(m, req.usage) + 0.14 * budget + 0.12 * ownership + 0.12 * seatFit + brand;
}

const fit = (score: number): FitStrength => (score >= 6.9 ? "strong" : score >= 5.8 ? "good" : "reasonable");

interface Cand {
  text: string;
  w: number;
}

function reasonsFor(car: Car, o: Option, req: Requirements, ctx: MetricContext): string[] {
  const m = metricsFor(car, o, ctx);
  const c: Cand[] = [];
  const price = optionPriceRange(car, o);
  const ncap = car.safety.ncap;
  const e = energyPerKm(o, ctx.assumptions);
  const prefs = activePreferences(req);

  if (ncap && (m.safety ?? 0) >= 8) c.push({ text: `${ncap.stars}-star ${ncap.body} rating${ncap.year ? ` (${ncap.year})` : ""}${ncap.note ? `: ${ncap.note}` : ""}`, w: prefs.includes("safety") ? 110 : 70 });
  if (e !== null && (m.efficiency ?? 0) >= 6.5) c.push({ text: `${o.efficiency ? `Claimed ${o.efficiency.value} ${o.efficiency.unit} (${o.efficiency.basis}), ` : ""}roughly ${formatInr(e * 100)} per 100 km at sample fuel prices you can edit`, w: prefs.includes("efficiency") ? 108 : 66 });
  if (o.powerPs && (m.performance ?? 0) >= 7) c.push({ text: `${o.powerPs.v} PS${o.torqueNm ? ` and ${o.torqueNm.v} Nm` : ""} from the ${o.engine}, strong for the catalogue`, w: prefs.includes("performance") ? 106 : 60 });
  const boot = car.dimensions.bootLitres?.v;
  if ((m.space ?? 0) >= 6.5) c.push({ text: `Seats ${seatsOf(car)}${boot ? ` with a ${boot} L boot` : ""}${car.dimensions.wheelbaseMm ? ` on a ${car.dimensions.wheelbaseMm.v} mm wheelbase` : ""}`, w: prefs.includes("space") ? 104 : 64 });
  const gc = car.dimensions.groundClearanceMm?.v;
  if (gc && (m.groundClearance ?? 0) >= 6.5) c.push({ text: `${gc} mm ground clearance helps on broken roads and speed breakers`, w: prefs.includes("groundClearance") || req.usage === "rough" ? 102 : 58 });
  if (usageScore(m, req.usage) >= 6.5) c.push({ text: `Well suited to ${USAGE_LABEL[req.usage]}`, w: 90 });
  c.push({ text: `${o.label} ${price.exact ? `from ${formatInr(price.min)} ex-showroom` : `(model starts at ${formatInr(price.min)} ex-showroom)`} sits inside your ${formatLakh(req.budgetMinLakh)} to ${formatLakh(req.budgetMaxLakh)} budget`, w: 80 });
  c.push({ text: seatsOf(car) >= req.minSeats + 2 ? `Seats up to ${seatsOf(car)}, comfortably covering the ${req.minSeats} you need` : `Seats ${seatsOf(car)}, covering the ${req.minSeats} you need`, w: 70 });
  if (req.powertrain !== "any") c.push({ text: `Available as ${FUEL_LABEL[o.fuel].toLowerCase()}, as you prefer`, w: 75 });
  if (o.fuel === "ev" && (req.chargingAccess === "home" || req.chargingAccess === "both")) c.push({ text: "Your home charging access suits an EV's low running costs", w: 92 });
  if (req.vehicleType !== "any" && car.bodyType === req.vehicleType) c.push({ text: `It is the ${BODY_LABEL[car.bodyType].toLowerCase()} body style you asked for`, w: 72 });
  if (req.brand !== BRAND_ANY && car.brand === req.brand) c.push({ text: `It is from ${car.brand}, the brand you named`, w: 85 });
  if (o.efficiency && o.fuel !== "ev") c.push({ text: `Claimed efficiency: ${o.efficiency.value} ${o.efficiency.unit} (${o.efficiency.basis})`, w: 50 });
  c.push({ text: `${o.engine} with ${o.transmission.toLowerCase()}`, w: 40 });
  if (car.warranty) c.push({ text: `Warranty: ${car.warranty.v}`, w: 35 });

  const unique = [...new Set(c.sort((a, b) => b.w - a.w).map((x) => x.text))];
  for (const f of car.safety.keyFeatures) {
    if (unique.length >= 5) break;
    unique.push(`Stated feature: ${f}`);
  }
  unique.push(car.summary);
  return unique.slice(0, 5);
}

function drawbacksFor(car: Car, o: Option, req: Requirements, ctx: MetricContext): string[] {
  const m = metricsFor(car, o, ctx);
  const out: string[] = [];
  const prefs = activePreferences(req);
  const price = optionPriceRange(car, o);
  const gc = car.dimensions.groundClearanceMm?.v;
  const boot = car.dimensions.bootLitres?.v;

  if ((prefs.includes("safety") || req.minSeats >= 5) && !car.safety.ncap) out.push("No NCAP crash-test rating found for this model, so its protection cannot be judged from a published result");
  else if (car.safety.ncap && car.safety.ncap.stars <= 3 && prefs.includes("safety")) out.push(`Only a ${car.safety.ncap.stars}-star ${car.safety.ncap.body} result${car.safety.ncap.year ? ` (${car.safety.ncap.year})` : ""}`);
  if (gc && gc < 170 && (req.usage === "rough" || prefs.includes("groundClearance"))) out.push(`${gc} mm ground clearance is on the low side for the rough roads you described`);
  if (o.fuel === "ev") {
    const r = o.ev?.claimedRangeKm?.v;
    if (req.chargingAccess !== "home" && req.chargingAccess !== "both") out.push(req.chargingAccess === "none" ? "You said you lack reliable charging access, which makes an EV difficult day to day" : "Relies on public charging unless you confirm home charging");
    if (r && r < 350 && (req.usage === "highway" || req.annualKm >= 18000)) out.push(`Claimed range of ${r} km (${o.ev?.rangeStandard ?? "test cycle"}) will be shorter on highways, so long trips need charging stops`);
  }
  if (price.exact && price.min > req.budgetMaxLakh * LAKH * 0.9) out.push("Near the top of your budget, leaving little room for insurance, registration and accessories");
  if (!price.exact) out.push("The maker has not published a separate price for this engine, so the model's starting price is shown");
  if (req.minSeats >= 6 && boot !== undefined && boot < 250) out.push(`Boot is ${boot} L with the third row in use, which is limited`);
  if (o.powerPs && o.powerPs.v < 85 && (req.usage === "highway" || prefs.includes("performance"))) out.push(`${o.powerPs.v} PS is modest for highway overtaking or a performance brief`);
  const e = energyPerKm(o, ctx.assumptions);
  if (e !== null && req.annualKm >= 15000 && (m.efficiency ?? 10) <= 3) out.push(`Fuel bills will be noticeable at ${formatNumber(req.annualKm, 0)} km a year (about ${formatInr(e * req.annualKm)} at sample prices)`);
  if (m.compactness !== null && m.compactness <= 3 && req.usage === "city") out.push("Long for tight city lanes and parking");
  for (const n of car.notes) {
    if (out.length >= 3) break;
    if (n.length < 160) out.push(n);
  }
  if (out.length === 0) out.push("No major drawback stands out against your stated brief, but check the variant you intend to buy");
  return out.slice(0, 4);
}

function bestOption(car: Car, req: Requirements, ctx: MetricContext) {
  return car.options
    .filter((o) => optionOk(car, o, req))
    .map((o) => ({ o, score: scoreOption(car, o, req, ctx) }))
    .sort((a, b) => b.score - a.score || optionPriceRange(car, a.o).min - optionPriceRange(car, b.o).min)[0] ?? null;
}

export function evaluateCar(car: Car, req: Requirements, ctx: MetricContext, optionId?: string | null): CarFit {
  const violations = carViolations(car, req);
  const best = violations.length === 0 ? bestOption(car, req, ctx) : null;
  const o = car.options.find((x) => x.id === optionId) ?? best?.o ?? car.options[0];
  if (optionId && !optionOk(car, o, req)) {
    const p = optionPriceRange(car, o);
    if (p.exact && (p.min < req.budgetMinLakh * LAKH || p.min > req.budgetMaxLakh * LAKH)) violations.push(`${o.label} costs ${formatInr(p.min)}, outside your budget`);
    if (!matchesPowertrain(o, req)) violations.push(`${o.label} is ${FUEL_LABEL[o.fuel].toLowerCase()}, not your chosen powertrain`);
  }
  const score = scoreOption(car, o, req, ctx);
  return { carId: car.id, optionId: o.id, eligible: violations.length === 0, violations, fit: fit(score), score: Math.round(score * 100) / 100, reasons: reasonsFor(car, o, req, ctx), drawbacks: drawbacksFor(car, o, req, ctx) };
}

export function recommend(cars: Car[], req: Requirements, ctx: MetricContext, limit = 5): MatchResult {
  const eligible: { car: Car; o: Option; score: number }[] = [];
  const excluded: { car: Car; violations: string[] }[] = [];
  for (const car of cars) {
    const v = carViolations(car, req);
    const best = v.length === 0 ? bestOption(car, req, ctx) : null;
    if (v.length || !best) excluded.push({ car, violations: v.length ? v : ["No engine matches your budget and powertrain"] });
    else eligible.push({ car, o: best.o, score: best.score });
  }
  eligible.sort((a, b) => b.score - a.score || a.car.id.localeCompare(b.car.id));
  const matches: Match[] = eligible.slice(0, limit).map((e, i) => ({
    rank: i + 1,
    carId: e.car.id,
    optionId: e.o.id,
    fit: fit(e.score),
    score: Math.round(e.score * 100) / 100,
    reasons: reasonsFor(e.car, e.o, req, ctx),
    drawbacks: drawbacksFor(e.car, e.o, req, ctx),
  }));

  const buckets = new Map<string, number>();
  for (const e of excluded) for (const v of e.violations) {
    const k = v.startsWith("Seats") ? "seating" : v.startsWith("It is a") ? "body type" : v.startsWith("Not offered") ? "powertrain" : v.startsWith("Electric only") ? "charging access" : "budget";
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const exclusionSummary = [...buckets].map(([k, n]) => `${n} ${n === 1 ? "car was" : "cars were"} ruled out on ${k}`);

  let shortfallNote: string | null = null;
  if (matches.length === 0) shortfallNote = "No car in the catalogue meets all of your requirements at once. Pitstop AI will not bend your budget, seating or powertrain just to fill the list.";
  else if (matches.length < limit) shortfallNote = `Only ${matches.length} ${matches.length === 1 ? "car" : "cars"} in the catalogue meet every requirement, so you are seeing ${matches.length} instead of ${limit}. Widening your budget, seating or powertrain would surface more.`;
  return { matches, shortfallNote, eligibleCount: eligible.length, excludedCount: excluded.length, exclusionSummary };
}

