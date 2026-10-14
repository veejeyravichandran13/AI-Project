#!/usr/bin/env node
// Merges data-src/<brand>.json into src/data/generated/catalogue.json and makes web-sized thumbnails.
// Fails (non-zero) if any brand file has validation errors, so bad data never reaches the app.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
spawnSync("node", ["scripts/optimize-images.mjs"], { cwd: root, stdio: "inherit" });
const srcDir = join(root, "data-src");
const files = readdirSync(srcDir).filter((f) => f.endsWith(".json") && f !== "brand-logos.json").sort();
mkdirSync(join(root, "public/cars/thumbs"), { recursive: true });

const logos = existsSync(join(srcDir, "brand-logos.json")) ? JSON.parse(readFileSync(join(srcDir, "brand-logos.json"), "utf8")) : {};
const brands = [];
const models = [];
let failed = false;

for (const f of files) {
  const v = spawnSync("node", ["scripts/validate.mjs", join("data-src", f)], { cwd: root, encoding: "utf8" });
  if (v.status !== 0) {
    failed = true;
    console.error(`✖ ${f} failed validation:\n${v.stdout}`);
    continue;
  }
  const data = JSON.parse(readFileSync(join(srcDir, f), "utf8"));
  brands.push({ ...data.brand, logo: logos[data.brand.slug] ?? null, modelCount: data.models.length });
  for (const m of data.models) {
    for (const img of m.images ?? []) {
      const base = basename(img.localPath).replace(/\.\w+$/, "");
      const out = join(root, "public/cars/thumbs", `${base}.webp`);
      if (!existsSync(out)) {
        await sharp(join(root, "public", img.localPath)).resize({ width: 720 }).webp({ quality: 78 }).toFile(out);
      }
      img.thumbPath = `/cars/thumbs/${base}.webp`;
    }
    m.brandLogo = logos[data.brand.slug]?.path ?? null;
    models.push(m);
  }
}

if (failed) process.exit(1);
if (models.length === 0) {
  console.warn("No models found yet; writing an empty catalogue.");
}
writeFileSync(
  join(root, "src/data/generated/catalogue.json"),
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), brands, models }),
);
console.log(`catalogue: ${brands.length} brands, ${models.length} models`);
