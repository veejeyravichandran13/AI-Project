#!/usr/bin/env node
// Wikimedia Commons helper: find free-licence photos and download them with attribution metadata.
//   node scripts/commons.mjs page "<Wikipedia article title>"     files used in that article (best starting point)
//   node scripts/commons.mjs category "<Commons category name>"   files in a Commons category
//   node scripts/commons.mjs search "<words>"                     full-text search (noisy)
//   node scripts/commons.mjs fetch "File:Name.jpg" public/cars/<id>-1.jpg
import { writeFile } from "node:fs/promises";

const API = "https://commons.wikimedia.org/w/api.php";
const WP = "https://en.wikipedia.org/w/api.php";
const UA = "PitstopAI-prototype/0.1 (local research script)";
const ALLOWED = [/^CC BY/i, /^CC0/i, /public domain/i, /^PD/i];

const strip = (s) =>
  (s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(base, params) {
  const url = `${base}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error("API unavailable");
}
const commons = (p) => call(API, p);

function describe(page) {
  const ii = page.imageinfo?.[0];
  const m = ii?.extmetadata ?? {};
  return {
    file: page.title,
    filePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    width: ii?.width,
    height: ii?.height,
    mime: ii?.mime,
    thumbUrl: ii?.thumburl,
    author: strip(m.Artist?.value) || "Unknown",
    license: strip(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value ?? null,
    description: strip(m.ImageDescription?.value).slice(0, 220),
    date: strip(m.DateTimeOriginal?.value).slice(0, 40),
  };
}

const INFO = { prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "1280" };
const usable = (p) => /jpe?g|png/.test(p.mime ?? "") && (p.width ?? 0) >= 1000 && ALLOWED.some((re) => re.test(p.license));

async function search(query) {
  const data = await commons({ action: "query", generator: "search", gsrsearch: `${query} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "20", ...INFO });
  return Object.values(data.query?.pages ?? {}).map(describe).filter(usable);
}

async function pageFiles(title) {
  const j = await call(WP, { action: "query", titles: title, redirects: "1", prop: "images", imlimit: "80" });
  const names = Object.values(j.query?.pages ?? {})
    .flatMap((p) => (p.images ?? []).map((i) => i.title))
    .filter((t) => /\.(jpe?g|png)$/i.test(t));
  const out = [];
  for (let i = 0; i < names.length; i += 20) {
    const data = await commons({ action: "query", titles: names.slice(i, i + 20).join("|"), ...INFO });
    out.push(...Object.values(data.query?.pages ?? {}).filter((p) => p.imageinfo).map(describe));
    await sleep(200);
  }
  return out.filter(usable);
}

async function category(cat) {
  const c = cat.startsWith("Category:") ? cat : `Category:${cat}`;
  const data = await commons({ action: "query", generator: "categorymembers", gcmtitle: c, gcmtype: "file", gcmlimit: "50", ...INFO });
  return Object.values(data.query?.pages ?? {}).map(describe).filter(usable);
}

async function fetchFile(title, out) {
  const data = await commons({ action: "query", titles: title, ...INFO });
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo) throw new Error(`File not found: ${title}`);
  const d = describe(page);
  if (!ALLOWED.some((re) => re.test(d.license))) throw new Error(`Licence not allowed: ${d.license}`);
  const res = await fetch(d.thumbUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download failed HTTP ${res.status}`);
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
  return {
    file: d.file,
    localPath: out.replace(/^.*?public/, ""),
    filePageUrl: d.filePageUrl,
    author: d.author,
    license: d.license,
    licenseUrl: d.licenseUrl,
    description: d.description,
  };
}

const print = (rows) => {
  for (const r of rows) {
    console.log(JSON.stringify({ file: r.file, size: `${r.width}x${r.height}`, license: r.license, author: r.author.slice(0, 60), date: r.date, description: r.description }));
  }
  if (rows.length === 0) console.log("(none found; try another article title / category / words)");
};

const [cmd, a, b] = process.argv.slice(2);
try {
  if (cmd === "search" && a) print(await search(a));
  else if (cmd === "page" && a) print(await pageFiles(a));
  else if (cmd === "category" && a) print(await category(a));
  else if (cmd === "fetch" && a && b) console.log(JSON.stringify(await fetchFile(a, b), null, 2));
  else {
    console.error('usage: commons.mjs page "<article>" | category "<name>" | search "<words>" | fetch "File:X.jpg" public/cars/<id>-1.jpg');
    process.exit(2);
  }
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
