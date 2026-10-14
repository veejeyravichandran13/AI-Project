# Research brief: build verified car data for Pitstop AI

You are one of several researchers. Each builds the dataset for specific manufacturers. The product shows these facts to car buyers in India, alongside the source link for each fact, so **accuracy and traceability matter more than completeness**. A missing value (null) is fine and honest; a wrong or remembered value is a failure.

Work in `/Users/vijay-11922/Desktop/AI Project/pitstop-ai`. Read `data-src/SCHEMA.md` first: it defines the exact JSON, the rules, and the two scripts.

## Per-model workflow (be efficient: aim for ~5–8 fetches per model)
1. **Manufacturer India page.** Find the model page on the brand's India website (WebSearch if needed) and WebFetch it with a focused prompt asking for: starting/max ex-showroom price, engine options (displacement, power, torque, transmission, fuel), claimed mileage/range, dimensions, boot, ground clearance, seating, warranty, safety features, variant/trim names with prices. Ask the fetcher to say "not stated" instead of guessing. If the page is thin (JS-rendered), try the brand's brochure/specification PDF, the "specifications" sub-page, or an official press release.
2. **Fill gaps with a clearly labelled secondary source** (type `third-party` or `wikipedia`): CarDekho, CarWale, ZigWheels, Autocar India, Team-BHP, Wikipedia. Prefer the manufacturer where both exist.
3. **Safety rating.** Search `"<model> Global NCAP"` / `"<model> Bharat NCAP"` (globalncap.org, bncap.in, Wikipedia). Record stars, year, protocol and which variant/market it applies to. If no rating exists, `"ncap": null`. Never guess a rating.
4. **Photos.** Use `scripts/commons.mjs` (`page`, `category`, `search`, then `fetch`). Pick 1–3 photos of THIS model and generation, ideally India-market, sharp, 3/4 front or side view. Read each candidate's description/date before choosing. Set `match` honestly. No suitable free photo => `images: []`.
   **Verify every photo by eye:** after `fetch`, open the saved file with the Read tool (it displays images) and confirm it really shows this model (body shape, badge, market). If it is wrong, delete the file (`rm`) and pick another; if no good photo exists, use `images: []`. Do not trust filenames alone.
5. **Write the JSON** to `data-src/<brand-slug>.json` (create it after your first model; update it as you go so progress is never lost; do not wait until the end). Run `node scripts/validate.mjs data-src/<brand-slug>.json` periodically and fix all errors.

## Price rules for premium brands
If a manufacturer shows no India price ("price on request"), use a third-party published ex-showroom price (CarDekho/CarWale/Autocar India/ZigWheels) and label that source `third-party`. If no price can be found anywhere, omit the model and report it.

## Hard rules
- Only models currently sold new in India (check the official site). Do not include discontinued models. If the brand has current models not on my candidate list, add them. If a candidate is not on sale, skip it and say why.
- Never use memory for a value that goes into the JSON. Every Fact must have a `s` pointing at a source you fetched. If in doubt, null.
- `retrievedAt` is `2026-10-12`. Use real URLs only (the exact page you fetched), never homepage placeholders.
- Convert units carefully and note conversions in `notes` (e.g. bhp→PS: ×1.0139; kW→PS: ×1.3596). Prefer PS as stated by Indian manufacturers; if only bhp/kW given, convert and note it.
- Prices: integers in rupees. `fromPriceInr` per option is the lowest ex-showroom price for that engine/transmission/battery combination if the source shows it; otherwise null. Do not invent per-option prices.
- Trims: list `trims` (name + price) only when a source publishes them. Max 8 per option.
- Keep each model's `sources` list tight (2–5 entries).
- Don't touch any file other than your own `data-src/<slug>.json` files and your new images in `public/cars/`. Don't run npm install, don't edit app code, don't write memory files.
- Be polite to servers: no loops hammering sites; the commons script already throttles.

## Final report (keep it under 250 words)
List: brands/files written; number of models included; models skipped and why; fields commonly null; any facts you are unsure about; any model with no photo. Do not paste the data back.
