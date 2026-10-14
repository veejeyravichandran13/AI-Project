# Pitstop AI

> We are there to assist you in choosing your Dream Car.

Pitstop AI helps people in India choose a **new car**. It covers real manufacturers and real models, with engine details, prices, safety ratings, dimensions and photos. Every fact links to the page it came from, and every photo is credited. A guided questionnaire then shortlists five cars that suit how you drive, and you can compare up to five cars and estimate what each costs to own.

## What is real, and what is not

**Real (collected from live sources, dated, and linked on each car's page):**

- Manufacturers, models, generations, body styles and seating.
- Engine options: displacement, power, torque, transmission, claimed efficiency (ARAI) or claimed EV range and battery size.
- Ex-showroom prices and trims, with the page each came from.
- Safety ratings from Global NCAP, Bharat NCAP or Euro NCAP, with year and protocol, only where a rating was found.
- Dimensions, ground clearance, boot space, warranty, where the sources state them.
- Photos from Wikimedia Commons, each shown with author and licence, and labelled when the photo shows another market or generation of the model.

**Honest gaps:**

- Anything a source did not state is blank and shown as "Not available". It is never estimated.
- Some manufacturer sites hide prices behind scripts that block automated access. For those models the price comes from a third-party site (CarDekho and similar), and the car's page says so. Prices change often; confirm with a dealer.
- About a third of models have no suitable free-licence photo. They show a clear placeholder, not a picture of a different car.
- Ranking uses only published figures (NCAP stars, claimed efficiency, power, boot, wheelbase, seats, ground clearance). Nothing is hand-rated.
- Fuel prices, electricity tariffs, on-road loading and servicing allowances in the cost tools are **editable generic samples**, not model-specific data.

See `/credits` in the app for the full sources and photo credits.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000   (rebuilds the catalogue first)
```

Or build a fully static site and serve it from anywhere:

```bash
npm run build        # validates data, makes thumbnails, writes ./out
npm start            # serves ./out at http://localhost:3000 (uses `npx serve`)
```

`./out` is plain static files, so it can be uploaded to any static host (Vercel, Netlify, Cloudflare Pages, an S3 bucket, Zoho Catalyst Slate). No server, database or environment variables are needed.

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build the static site, serve it |
| `npm run build:data` | Validate `data-src/*.json`, recompress photos, make thumbnails, regenerate the catalogue |
| `npm run validate:data` | Validate every data file only |
| `npm run typecheck` / `lint` / `test` | TypeScript (strict), ESLint, Vitest |
| `npm run verify` | All of the above plus a production build |

Requires Node 20+.

## How the data is organised

```
data-src/<brand>.json     one file per manufacturer: the source of truth (see SCHEMA.md)
public/cars/              downloaded photos (+ thumbs/)
scripts/                  build-data, validate, commons (Wikimedia photo tool), optimize-images, contact-sheet
src/data/generated/       catalogue.json built from data-src (do not edit)
```

Each fact is `{ "v": value, "s": "source-id" }`. Each model lists its sources (URL, publisher, type, retrieval date). `scripts/validate.mjs` fails the build if a fact cites an unknown source, a source has no real URL, a photo file or attribution is missing, or a price is implausible. To add or update a car, edit the brand's JSON, run `npm run build:data`, and the app picks it up.

`scripts/commons.mjs` finds free-licence photos on Wikimedia Commons and downloads them with attribution metadata. `scripts/contact-sheet.mjs` makes labelled contact sheets so photos can be checked against model names by eye.

## Features

- **Home:** cinematic hero with real photos and credits, a plain-language search ("7-seater diesel SUV under 20 lakh"), manufacturer wall, body-style tiles, longest-range EVs and cheapest 5-star cars.
- **Explore:** every model with filters for price (log-scale slider), body style, fuel, seats, NCAP stars and manufacturer; URL-shareable; sortable.
- **⌘K / Ctrl+K palette:** jump to any car or brand, or describe what you want. The parser is rules-based and runs in the browser. No AI service is called.
- **Car page:** photo gallery with credits, engines and trims, EV battery and range, dimension schematic, NCAP detail, price by option, ownership estimate, footnoted citations `[n]` that jump to the source list, and similar cars.
- **Brand pages:** manufacturer, parent group, models, official website link.
- **Find My Car:** a guided questionnaire (React Hook Form + Zod) with a live preview of how many real cars still match and which lead. It ends with a review step and five matches, each with five reasons built from real figures, trade-offs, and a metrics panel.
- **Compare:** up to five cars with a radar chart, a full table with per-value source links, best-in-row marks only when values are complete and comparable, and a "for you" interpretation.
- **Cost Lab:** shared, editable assumptions, stacked and cumulative charts (with data tables), and a break-even check that only reports a figure when the numbers support it.
- Light and dark themes, keyboard and screen-reader support, reduced-motion support, and a static export.

## Stack

Next.js 15 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Phosphor Icons · Zustand · TanStack Query · React Hook Form + Zod · Radix primitives · `next-themes` · `sharp` for images.

`lib/mock-api` is still an async service boundary (with optional simulated failure from the footer's Demo controls), so a live API can replace the local catalogue later without touching the UI.

## Accessibility notes

Skip link, landmarks, focus moved to each questionnaire step, associated labels and errors, focus trapping and return in dialogs, 44px touch targets, `aria-live` for async status, no meaning conveyed by colour alone (icons, text, patterns and marker shapes; every chart has a data table), and tuned light and dark themes.

## Known limitations

- Photos are chosen from Commons by description and then checked visually; a few show a different generation or market and are labelled as such.
- Data coverage depends on what each source publishes: ground clearance, boot, warranty, claimed mileage and NCAP results are missing for many models.
- Third-party prices may be stale relative to the manufacturer's current list.
- No backend, accounts, dealer data or live pricing. Saved shortlist and comparison live only in this browser.
- Tests cover logic and data integrity, not browser interaction.
