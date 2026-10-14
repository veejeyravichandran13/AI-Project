#!/usr/bin/env node
// Downloads official brand logos (SVG) from Wikimedia Commons into public/brands/ and writes
// data-src/brand-logos.json with file page, author and licence. Only files whose licence is
// public domain / CC are accepted. Brands with no suitable file are left out and the UI shows a
// plain text wordmark instead.  Usage: node scripts/fetch-logos.mjs
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "PitstopAI-prototype/0.1 (local research script)";
const ALLOWED = [/^CC BY/i, /^CC0/i, /public domain/i, /^PD/i];
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FILES = {
  "aston-martin": "Aston Martin wordmark.svg",
  audi: "Audi-Logo 2016.svg",
  bentley: "Bentley.svg",
  bmw: "BMW.svg",
  byd: "BYD Auto 2022 logo.svg",
  citroen: "Citroën Logo.svg",
  ferrari: "Ferrari wordmark.svg",
  force: "Force Motors Logo.svg",
  honda: "Honda logo.svg",
  hyundai: "Hyundai Motor Company logo.svg",
  isuzu: "Isuzu.svg",
  jeep: "Jeep logo.svg",
  kia: "KIA logo3.svg",
  lamborghini: "Lamborghini - logo wordmark (italy, 1963-).svg",
  "land-rover": "Land Rover 2023.svg",
  lexus: "Lexus.svg",
  mahindra: "Mahindra logo.svg",
  "maruti-suzuki": "Maruti Suzuki logo.svg",
  maserati: "Maserati logo 2.svg",
  "mercedes-benz": "Mercedes-Benz free logo.svg",
  mg: "MG Motor 2021 logo.svg",
  mini: "MINI logo.svg",
  nissan: "Nissan 2020 logo.svg",
  porsche: "Porsche wordmark.svg",
  renault: "Renault 2021.svg",
  "rolls-royce": "Rolls-Royce Motor Cars logo.svg",
  skoda: "Škoda Auto.svg",
  tata: "Tata Motors Logo.svg",
  toyota: "Toyota.svg",
  volkswagen: "Volkswagen logo 2019.svg",
  volvo: "Volvo logo.svg",
  ...JSON.parse(process.env.EXTRA ?? "{}"),
};

const slugs = readdirSync("data-src").filter((f) => f.endsWith(".json") && f !== "brand-logos.json").map((f) => JSON.parse(readFileSync(`data-src/${f}`, "utf8")).brand.slug);
for (const s of Object.keys(FILES)) if (!slugs.includes(s)) throw new Error(`Unknown brand slug ${s}`);

async function api(titles) {
  const url = `${API}?${new URLSearchParams({ format: "json", action: "query", titles, prop: "imageinfo", iiprop: "url|extmetadata|size|mime" })}`;
  for (let t = 0; t < 6; t++) {
    const x = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    try { return JSON.parse(x); } catch { await sleep(8000); }
  }
  throw new Error("API unavailable");
}

mkdirSync("public/brands", { recursive: true });
const entries = Object.entries(FILES);
const meta = {};
for (let i = 0; i < entries.length; i += 30) {
  const j = await api(entries.slice(i, i + 30).map(([, f]) => `File:${f}`).join("|"));
  for (const p of Object.values(j.query.pages)) meta[p.title] = p;
  await sleep(3000);
}
const out = existsSync("data-src/brand-logos.json") ? JSON.parse(readFileSync("data-src/brand-logos.json", "utf8")) : {};
for (const [slug, file] of entries) {
  if (out[slug] && existsSync(`public/brands/${slug}.svg`)) continue;
  const title = `File:${file}`;
  const p = Object.values(meta).find((m) => m.title === title);
  const ii = p?.imageinfo?.[0];
  if (!ii) { console.log(`SKIP ${slug}: ${file} not found`); continue; }
  const m = ii.extmetadata ?? {};
  const license = strip(m.LicenseShortName?.value);
  if (!ALLOWED.some((re) => re.test(license))) { console.log(`SKIP ${slug}: licence ${license}`); continue; }
  let res;
  for (let t = 0; t < 5; t++) { res = await fetch(ii.url, { headers: { "User-Agent": UA } }); if (res.status !== 429) break; await sleep(10000); }
  if (!res.ok) { console.log(`SKIP ${slug}: download HTTP ${res.status}`); await sleep(3000); continue; }
  writeFileSync(`public/brands/${slug}.svg`, Buffer.from(await res.arrayBuffer()));
  out[slug] = {
    path: `/brands/${slug}.svg`,
    file: p.title,
    filePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
    author: strip(m.Artist?.value) || "Unknown",
    license,
    licenseUrl: m.LicenseUrl?.value ?? null,
    trademark: /trademark/i.test(strip(m.Restrictions?.value)),
  };
  console.log(`OK   ${slug} <- ${file} (${license})`);
  await sleep(4000);
}
writeFileSync("data-src/brand-logos.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length}/${slugs.length} brands have a logo`);
