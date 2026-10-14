#!/usr/bin/env node
// Re-encodes oversized originals in public/cars (max 1280px wide, mozjpeg q78). Safe to re-run.
import { readdirSync, statSync, renameSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dir = join(process.cwd(), "public/cars");
let saved = 0;
let n = 0;
for (const f of readdirSync(dir).filter((x) => /\.(jpe?g|png)$/i.test(x))) {
  const p = join(dir, f);
  const before = statSync(p).size;
  if (before < 220 * 1024) continue;
  const tmp = `${p}.tmp`;
  await sharp(p).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(tmp);
  if (statSync(tmp).size < before) {
    renameSync(tmp, p);
    saved += before - statSync(p).size;
    n++;
  } else {
    renameSync(tmp, `${tmp}.discard`);
  }
}
console.log(`optimised ${n} images, saved ${(saved / 1048576).toFixed(1)} MB`);
