#!/usr/bin/env node
// Structural + provenance validation for data-src/<brand>.json
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const file = process.argv[2];
if (!file) { console.error("usage: validate.mjs data-src/<brand>.json"); process.exit(2); }
const root = process.cwd();
const errors = [];
const warn = [];
let data;
try { data = JSON.parse(readFileSync(file, "utf8")); } catch (e) { console.error("INVALID JSON:", e.message); process.exit(1); }

const BODY = ["hatchback", "sedan", "compact-suv", "suv", "mpv", "coupe", "pickup"];
const FUEL = ["petrol", "diesel", "cng", "mild-hybrid", "strong-hybrid", "ev"];
const SRC = ["manufacturer", "brochure", "ncap", "wikipedia", "third-party"];
const MATCH = ["exact", "same-model-other-market", "same-model-other-generation"];
const isUrl = (u) => typeof u === "string" && /^https?:\/\/[^ ]+\.[^ ]+/.test(u);

if (!data.brand?.name || !data.brand?.slug) errors.push("brand.name/slug missing");
if (!isUrl(data.brand?.indiaWebsite)) errors.push("brand.indiaWebsite must be a URL");
if (!Array.isArray(data.models) || data.models.length === 0) errors.push("models[] missing");

const ids = new Set();
for (const m of data.models ?? []) {
  const where = m.id ?? "(model without id)";
  const e = (msg) => errors.push(`${where}: ${msg}`);
  if (!m.id || !m.id.startsWith(data.brand?.slug + "-")) e("id must start with brandSlug-");
  if (ids.has(m.id)) e("duplicate id"); ids.add(m.id);
  if (!BODY.includes(m.bodyType)) e(`bodyType invalid: ${m.bodyType}`);
  if (!m.model || !m.summary) e("model/summary missing");
  if (!isUrl(m.officialUrl)) e("officialUrl must be a URL");
  const srcIds = new Set((m.sources ?? []).map((s) => s.id));
  if (srcIds.size === 0) e("sources[] empty");
  for (const s of m.sources ?? []) {
    if (!SRC.includes(s.type)) e(`source ${s.id}: bad type`);
    if (!isUrl(s.url)) e(`source ${s.id}: url must be a real URL`);
    if (!s.retrievedAt) e(`source ${s.id}: retrievedAt missing`);
  }
  // every Fact must cite a known source
  const walk = (node, path) => {
    if (node && typeof node === "object") {
      if (!Array.isArray(node) && "v" in node) {
        if (node.v === null || node.v === undefined) e(`${path}: Fact with null v (use null instead)`);
        if (!srcIds.has(node.s)) e(`${path}: unknown source id "${node.s}"`);
        return;
      }
      if (!Array.isArray(node) && "s" in node && typeof node.s === "string" && ("stars" in node || "unit" in node)) {
        if (!srcIds.has(node.s)) e(`${path}: unknown source id "${node.s}"`);
      }
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(m.dimensions, "dimensions"); walk(m.safety, "safety"); walk(m.warranty, "warranty"); walk(m.price, "price"); walk(m.options, "options");
  if (!m.seats || !srcIds.has(m.seats.s)) e("seats Fact with source required");
  if (!m.price?.minInr || typeof m.price.minInr.v !== "number") e("price.minInr required (number)");
  else if (m.price.minInr.v < 100000 || m.price.minInr.v > 300000000) e(`price.minInr implausible: ${m.price.minInr.v}`);
  if (m.price?.maxInr && m.price.maxInr.v < m.price.minInr?.v) e("price.maxInr < minInr");
  if (!Array.isArray(m.options) || m.options.length === 0) e("options[] required");
  for (const o of m.options ?? []) {
    if (!FUEL.includes(o.fuel)) e(`option ${o.id}: fuel invalid`);
    if (!o.label || !o.engine || !o.transmission) e(`option ${o.id}: label/engine/transmission required`);
    if (o.fuel === "ev" && !o.ev) e(`option ${o.id}: ev block required for EV`);
    if (o.fuel !== "ev" && o.ev) e(`option ${o.id}: ev block on non-EV`);
    if (!o.powerPs) warn.push(`${where}/${o.id}: powerPs missing`);
    if (!o.efficiency && o.fuel !== "ev") warn.push(`${where}/${o.id}: efficiency missing`);
    if (o.efficiency && !["km/l", "km/kg", "km/kWh"].includes(o.efficiency.unit)) e(`option ${o.id}: efficiency.unit invalid`);
  }
  for (const img of m.images ?? []) {
    if (!MATCH.includes(img.match)) e(`image ${img.file}: match invalid`);
    if (!img.author || !img.license || !img.filePageUrl || !img.caption) e(`image ${img.file}: author/license/filePageUrl/caption required`);
    if (!existsSync(join(root, "public", img.localPath ?? "__none__"))) e(`image ${img.file}: local file missing (${img.localPath})`);
  }
  if ((m.images ?? []).length === 0) warn.push(`${where}: no image`);
}
for (const w of warn) console.log("WARN ", w);
for (const x of errors) console.log("ERROR", x);
console.log(`\n${data.models?.length ?? 0} models · ${errors.length} errors · ${warn.length} warnings`);
process.exit(errors.length ? 1 : 0);
