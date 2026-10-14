#!/usr/bin/env node
// Probes explicit Commons file titles (one batched request per 40) and prints which exist, with licence info.
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "PitstopAI-prototype/0.1 (local research script)";
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const titles = process.argv.slice(2).map((t) => (t.startsWith("File:") ? t : `File:${t}`));
for (let i = 0; i < titles.length; i += 40) {
  const url = `${API}?${new URLSearchParams({ format: "json", action: "query", titles: titles.slice(i, i + 40).join("|"), prop: "imageinfo", iiprop: "url|extmetadata|size|mime" })}`;
  let j;
  for (let t = 0; t < 5; t++) { const r = await fetch(url, { headers: { "User-Agent": UA } }); const x = await r.text(); try { j = JSON.parse(x); break; } catch { await new Promise((r) => setTimeout(r, 6000)); } }
  for (const p of Object.values(j.query.pages)) {
    const ii = p.imageinfo?.[0]; const m = ii?.extmetadata ?? {};
    console.log(p.missing !== undefined ? `MISSING  ${p.title}` : `OK       ${p.title} | ${ii.mime} ${ii.width}x${ii.height} | ${strip(m.LicenseShortName?.value)} | ${strip(m.Artist?.value).slice(0,30)} | ${strip(m.Restrictions?.value)}`);
  }
  await new Promise((r) => setTimeout(r, 4000));
}
