#!/usr/bin/env node
// Finds SVG logo candidates for given search terms, slowly (Commons rate-limits).
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "PitstopAI-prototype/0.1 (local research script)";
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
for (const q of process.argv.slice(2)) {
  const url = `${API}?${new URLSearchParams({ format: "json", action: "query", generator: "search", gsrsearch: `${q} filetype:drawing`, gsrnamespace: "6", gsrlimit: "10", prop: "imageinfo", iiprop: "url|extmetadata|size|mime" })}`;
  let j;
  for (let t = 0; t < 6; t++) { const x = await (await fetch(url, { headers: { "User-Agent": UA } })).text(); try { j = JSON.parse(x); break; } catch { await new Promise((r) => setTimeout(r, 8000)); } }
  console.log(`\n## ${q}`);
  for (const p of Object.values(j?.query?.pages ?? {})) { const ii = p.imageinfo?.[0]; const m = ii?.extmetadata ?? {}; console.log(`${p.title} | ${ii?.width}x${ii?.height} | ${strip(m.LicenseShortName?.value)} | ${strip(m.Restrictions?.value)}`); }
  await new Promise((r) => setTimeout(r, 5000));
}
