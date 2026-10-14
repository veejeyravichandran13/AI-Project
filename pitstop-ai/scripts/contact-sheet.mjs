#!/usr/bin/env node
// Builds labelled contact sheets of every model's lead photo so photos can be checked against names by eye.
//   node scripts/contact-sheet.mjs <outDir> [brandSlug ...]
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [outDir, ...only] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const items = [];
for (const f of readdirSync("data-src").filter((x) => x.endsWith(".json") && x !== "brand-logos.json").sort()) {
  if (only.length && !only.includes(f.replace(".json", ""))) continue;
  const d = JSON.parse(readFileSync(join("data-src", f), "utf8"));
  for (const m of d.models) {
    const img = m.images?.[0];
    items.push({ id: m.id, label: `${m.brand} ${m.model}`, match: img?.match ?? "NO PHOTO", path: img ? join("public", img.localPath) : null });
  }
}
const W = 420, H = 262, COLS = 4, ROWS = 4, PER = COLS * ROWS;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
for (let s = 0; s * PER < items.length; s++) {
  const chunk = items.slice(s * PER, (s + 1) * PER);
  const tiles = [];
  for (let i = 0; i < chunk.length; i++) {
    const it = chunk[i];
    const x = (i % COLS) * W, y = Math.floor(i / COLS) * H;
    let base = sharp({ create: { width: W - 6, height: H - 6, channels: 3, background: "#222" } }).png();
    if (it.path) base = sharp(it.path).resize(W - 6, H - 6, { fit: "cover" });
    const label = Buffer.from(`<svg width="${W - 6}" height="${H - 6}"><rect y="${H - 6 - 44}" width="${W - 6}" height="44" fill="rgba(0,0,0,0.78)"/><text x="8" y="${H - 6 - 26}" font-size="17" font-family="Helvetica,Arial,sans-serif" font-weight="bold" fill="#fff">${esc(it.label)}</text><text x="8" y="${H - 6 - 8}" font-size="13" font-family="Helvetica,Arial,sans-serif" fill="${it.match === "exact" ? "#7CFF9B" : "#FFC966"}">${esc(it.match)}</text></svg>`);
    const buf = await base.composite([{ input: label }]).png().toBuffer();
    tiles.push({ input: buf, left: x, top: y });
  }
  await sharp({ create: { width: W * COLS, height: H * ROWS, channels: 3, background: "#000" } }).composite(tiles).jpeg({ quality: 80 }).toFile(join(outDir, `sheet-${String(s + 1).padStart(2, "0")}.jpg`));
}
console.log(`${items.length} models -> ${Math.ceil(items.length / PER)} sheets in ${outDir}`);
