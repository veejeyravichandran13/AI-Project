#!/usr/bin/env node
// Renders every downloaded brand logo onto a labelled contact sheet so they can be checked by eye.
import sharp from "sharp";
import { readdirSync } from "node:fs";
const files = readdirSync("public/brands").filter((f) => f.endsWith(".svg")).sort();
const W = 300, H = 150, COLS = 4, rows = Math.ceil(files.length / COLS);
const tiles = [];
for (let i = 0; i < files.length; i++) {
  const png = await sharp(`public/brands/${files[i]}`, { density: 150 }).resize(W - 40, H - 50, { fit: "inside" }).flatten({ background: "#ffffff" }).png().toBuffer();
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="24"><text x="8" y="17" font-family="Helvetica" font-size="14" fill="#c00">${files[i].replace(".svg", "")}</text></svg>`);
  tiles.push({ input: png, left: (i % COLS) * W + 20, top: Math.floor(i / COLS) * H + 28 });
  tiles.push({ input: label, left: (i % COLS) * W, top: Math.floor(i / COLS) * H + 2 });
}
await sharp({ create: { width: W * COLS, height: H * rows, channels: 3, background: "#ffffff" } }).composite(tiles).png().toFile(process.argv[2] ?? "logo-sheet.png");
