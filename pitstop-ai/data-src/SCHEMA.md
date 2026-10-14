# Real-data schema for Pitstop AI (one JSON file per manufacturer: `data-src/<brand-slug>.json`)

The file is a JSON object: `{ "brand": {...}, "models": [ ...Model ] }`.

## Absolute rules (the whole product depends on these)
1. **Never fill a value from memory.** Every non-null number/string fact must be stated on a page you actually fetched in this session (WebFetch, WebSearch result text, or curl). If you "know" a value but did not see it on a fetched page, use `null`.
2. Every fact is a **Fact object**: `{ "v": <value>, "s": "<sourceId>" }`. `sourceId` must exist in that model's `sources` array. Unknown => `null` (not `{v:null}`).
3. If two sources disagree, use the more authoritative one (manufacturer India site > official brochure/press release > Global/Bharat NCAP > Wikipedia > third-party reviewers/price sites) and note the disagreement in `notes`.
4. Prices are **ex-showroom, Delhi (or "India (starting)")**, in rupees (integers). Record the page's own "as of" date if shown; always record `retrievedAt: "2026-10-12"`.
5. Only models **currently on sale new in India** (verify on the manufacturer's India site). Skip discontinued ones and say so in your final report.
6. Do not copy paragraphs. `summary` is one factual sentence you wrote yourself.
7. Fuel efficiency is the **claimed (ARAI/test-cycle)** figure, with its unit and basis. EV range is the **claimed** range with its standard (e.g. "ARAI MIDC", "IDC", "WLTP").

## Types

```jsonc
Fact<T> = { "v": T, "s": "src-id" }

Source = {
  "id": "src-1",                       // unique within the model
  "type": "manufacturer" | "brochure" | "ncap" | "wikipedia" | "third-party",
  "label": "Maruti Suzuki India – Swift page",
  "publisher": "Maruti Suzuki India Ltd",
  "url": "https://...",                // the real URL you fetched
  "retrievedAt": "2026-10-12",
  "publishedAt": "2025-09-22" | null   // if the page states a date
}

Brand = {
  "name": "Maruti Suzuki",
  "slug": "maruti-suzuki",
  "country": "India" | "South Korea" | ...,   // country of the parent group's HQ
  "parent": "Suzuki Motor Corporation" | null,
  "indiaWebsite": "https://www.marutisuzuki.com/",
  "wikipediaUrl": "https://en.wikipedia.org/wiki/Maruti_Suzuki",
  "founded": Fact<number> | null              // from Wikipedia, optional
}

Model = {
  "id": "maruti-suzuki-swift",                // brandSlug-modelSlug
  "brand": "Maruti Suzuki",
  "model": "Swift",
  "generation": "4th generation (Z-series, launched 2024)" | null,
  "bodyType": "hatchback" | "sedan" | "compact-suv" | "suv" | "mpv" | "coupe" | "pickup",
  "seats": Fact<number>,                      // max seating
  "summary": "One factual sentence.",
  "officialUrl": "https://...",               // model page on the manufacturer's India site
  "wikipediaUrl": "https://en.wikipedia.org/wiki/..." | null,
  "dimensions": {
    "lengthMm": Fact<number>|null, "widthMm": Fact<number>|null, "heightMm": Fact<number>|null,
    "wheelbaseMm": Fact<number>|null, "groundClearanceMm": Fact<number>|null,
    "bootLitres": Fact<number>|null, "fuelTankLitres": Fact<number>|null, "kerbWeightKg": Fact<number>|null
  },
  "safety": {
    "ncap": { "body": "Global NCAP"|"Bharat NCAP"|"Euro NCAP"|"ASEAN NCAP"|"ANCAP",
              "stars": number, "adultOccupantStars": number|null, "childOccupantStars": number|null,
              "year": number, "protocol": "string|null", "s": "src-id",
              "note": "e.g. rating applies to the India-spec model / a specific variant" } | null,
    "airbagsStandard": Fact<number> | null,
    "keyFeatures": ["ABS with EBD", "..."]      // only what the sources state; max 8
  },
  "warranty": Fact<string> | null,              // e.g. "3 years / 1,00,000 km"
  "price": {
    "minInr": Fact<number>, "maxInr": Fact<number>|null,
    "basis": "ex-showroom", "location": "Delhi" | "India (starting)",
    "asOf": "2026-10-12" | "page date"
  },
  "options": [                                  // each distinct engine+transmission/battery option
    {
      "id": "petrol-mt",
      "label": "1.2 L petrol · 5-speed manual",
      "fuel": "petrol" | "diesel" | "cng" | "mild-hybrid" | "strong-hybrid" | "ev",
      "engine": "1.2 L Z-Series 3-cylinder" | "Permanent magnet synchronous motor",
      "displacementCc": Fact<number>|null,
      "cylinders": number|null,
      "powerPs": Fact<number>|null,             // PS (metric hp). If only kW or bhp is stated, convert and say so in notes
      "torqueNm": Fact<number>|null,
      "transmission": "5-speed manual",
      "efficiency": { "value": 24.8, "unit": "km/l"|"km/kg"|"km/kWh", "basis": "ARAI", "s": "src-id" } | null,
      "ev": { "batteryKwh": Fact<number>|null, "claimedRangeKm": Fact<number>|null, "rangeStandard": "ARAI MIDC"|null,
              "acChargeNote": Fact<string>|null, "dcFastChargeNote": Fact<string>|null } | null,
      "fromPriceInr": Fact<number>|null,        // lowest ex-showroom price of this option
      "trims": [ { "name": "VXi", "priceInr": Fact<number>|null } ]   // trims for this option when published (can be empty)
    }
  ],
  "images": [                                 // 1–3 photos from Wikimedia Commons, see scripts/commons.mjs
    {
      "file": "File:....jpg",
      "localPath": "/cars/maruti-suzuki-swift-1.jpg",
      "filePageUrl": "https://commons.wikimedia.org/wiki/File:...",
      "author": "…", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/...",
      "caption": "what the photo actually shows (year, model, market if evident)",
      "match": "exact" | "same-model-other-market" | "same-model-other-generation"
    }
  ],
  "sources": [ Source ],
  "notes": ["anything a reader should know: discrepancies, missing data, variant caveats"]
}
```

## Tools
- `node scripts/commons.mjs search "Tata Nexon 2023"` → candidate free-licence photos (title, size, author, licence, description).
- `node scripts/commons.mjs fetch "File:Name.jpg" public/cars/<model-id>-1.jpg` → downloads a 1280px JPEG and prints the image metadata object for the `images` array (without `caption`/`match`, which you add after looking at the description).
  Choose photos that *actually depict this exact model and generation* (check the file name/description). Prefer India-market photos. If the best available photo is a different market/generation, set `match` accordingly. If nothing suitable exists, use `"images": []`; never pick an unrelated car.
- `node scripts/validate.mjs data-src/<brand-slug>.json` → structural validation. Fix every error before finishing.
