import Link from "next/link";
import { ArrowRight, BatteryCharging, ShieldCheck, Tag } from "@phosphor-icons/react/dist/ssr";
import type { Car } from "@/types/car";
import { staticCatalogue as cat } from "@/lib/server-data";
import { BODY_LABEL, brandTier, carMinPrice, evRangeKm, ncapStars } from "@/lib/catalogue";
import { formatPriceCompact } from "@/lib/formatters";
import { HeroShowcase, type Slide } from "@/features/home/hero-showcase";
import { CarCard } from "@/components/cars/car-card";
import { CarPhoto } from "@/components/cars/car-photo";
import { BrandLogo } from "@/components/brands/brand-logo";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";

const FEATURED = ["tata-harrier", "mahindra-thar-roxx", "hyundai-creta", "tata-nexon", "mahindra-xuv700", "kia-seltos", "skoda-kylaq", "tata-curvv", "maruti-suzuki-brezza", "tata-safari"];

function pickSlides(): Slide[] {
  const withExact = cat.models.filter((m) => m.images[0]?.match === "exact");
  const ordered = [...FEATURED.map((id) => withExact.find((m) => m.id === id)).filter((m): m is Car => !!m), ...withExact.filter((m) => !FEATURED.includes(m.id) && ncapStars(m) === 5)];
  return ordered.slice(0, 5).map((m) => {
    const img = m.images[0];
    return { id: m.id, name: `${m.brand} ${m.model}`, price: formatPriceCompact(carMinPrice(m)), src: img.localPath, alt: `${m.brand} ${m.model}: ${img.caption}`, author: img.author, license: img.license, filePageUrl: img.filePageUrl };
  });
}

export default function HomePage() {
  const slides = pickSlides();
  const optionCount = cat.models.reduce((n, m) => n + m.options.length, 0);
  const sourceCount = cat.models.reduce((n, m) => n + m.sources.length, 0);
  const stats = [
    { value: cat.brands.length, label: "Manufacturers" },
    { value: cat.models.length, label: "Models" },
    { value: optionCount, label: "Engine options" },
    { value: sourceCount, label: "Cited sources" },
  ];

  const brands = cat.brands
    .filter((b) => brandTier(Math.min(...cat.models.filter((m) => m.brand === b.name).map(carMinPrice))) === "mass")
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name));

  const bodyTypes = (["suv", "compact-suv", "hatchback", "sedan", "mpv"] as const).map((b) => ({ b, cars: cat.models.filter((m) => m.bodyType === b) })).filter((x) => x.cars.length);
  const bodyPhoto = (cars: Car[]) => cars.find((c) => c.images[0]?.match === "exact") ?? cars.find((c) => c.images[0]);

  const evs = cat.models.filter((m) => m.options.some((o) => o.fuel === "ev") && m.images[0]).sort((a, b) => (Math.max(...b.options.map((o) => evRangeKm(o) ?? 0))) - (Math.max(...a.options.map((o) => evRangeKm(o) ?? 0)))).slice(0, 6);
  const safest = cat.models.filter((m) => ncapStars(m) === 5 && m.images[0]).sort((a, b) => carMinPrice(a) - carMinPrice(b)).slice(0, 6);

  return (
    <>
      <HeroShowcase slides={slides} stats={stats} />

      <section className="py-20 sm:py-28" aria-labelledby="brands-h">
        <Container className="max-w-[88rem]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Manufacturers</p>
              <h2 id="brands-h" className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Every maker, one place</h2>
            </div>
            <Link href="/brands" className={buttonClass("secondary")}>All manufacturers <ArrowRight size={18} /></Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {brands.slice(0, 12).map((b) => (
              <li key={b.slug}>
                <Link href={`/brands/${b.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/50">
                  <BrandLogo name={b.name} logo={b.logo?.path} bare pad="p-6" className="aspect-[16/10] bg-white [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105" />
                  <span className="flex flex-col border-t border-line p-3.5">
                    <span className="font-display text-lg font-semibold leading-tight">{b.name}</span>
                    <span className="text-xs text-muted">{b.modelCount} {b.modelCount === 1 ? "model" : "models"} · {b.country}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-line bg-surface/50 py-20 sm:py-28" aria-labelledby="body-h">
        <Container className="max-w-[88rem]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Body styles</p>
          <h2 id="body-h" className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Start with the shape you want</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {bodyTypes.map(({ b, cars }) => {
              const c = bodyPhoto(cars);
              return (
                <li key={b}>
                  <Link href={`/cars?body=${b}`} className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl border border-line p-5">
                    {c ? <CarPhoto car={c} className="absolute inset-0 -z-10" imgClassName="transition-transform duration-700 group-hover:scale-110" /> : null}
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="font-display text-2xl font-semibold text-white">{BODY_LABEL[b]}</span>
                    <span className="text-sm text-white/70">{cars.length} models</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {evs.length > 0 ? (
        <section className="py-20 sm:py-28" aria-labelledby="ev-h">
          <Container className="max-w-[88rem]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ev"><BatteryCharging size={16} weight="fill" /> Electric</p>
                <h2 id="ev-h" className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Longest-range EVs on sale</h2>
                <p className="mt-3 max-w-xl text-muted">Ranked by the manufacturer’s claimed range. Real-world range is usually lower, and each figure’s test standard is on the car’s page.</p>
              </div>
              <Link href="/cars?fuel=ev" className={buttonClass("secondary")}>All electric cars <ArrowRight size={18} /></Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {evs.map((c, i) => <li key={c.id}><CarCard car={c} index={i} className="h-full" /></li>)}
            </ul>
          </Container>
        </section>
      ) : null}

      {safest.length > 0 ? (
        <section className="border-t border-line bg-surface/50 py-20 sm:py-28" aria-labelledby="safe-h">
          <Container className="max-w-[88rem]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><ShieldCheck size={16} weight="fill" /> Safety</p>
                <h2 id="safe-h" className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Cheapest 5-star cars</h2>
                <p className="mt-3 max-w-xl text-muted">Models with a published 5-star NCAP result (Global NCAP or Bharat NCAP), cheapest first. Ratings apply to the tested variant and protocol shown on each car’s page.</p>
              </div>
              <Link href="/cars?ncap=5" className={buttonClass("secondary")}>All 5-star cars <ArrowRight size={18} /></Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {safest.map((c, i) => <li key={c.id}><CarCard car={c} index={i} className="h-full" /></li>)}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="py-20 sm:py-28" aria-labelledby="how-h">
        <Container className="max-w-[88rem]">
          <div className="grid items-center gap-10 rounded-[2rem] border border-line bg-surface p-8 shadow-[var(--shadow-card)] sm:p-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><Tag size={16} weight="fill" /> Guided matching</p>
              <h2 id="how-h" className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Not sure where to start?</h2>
              <p className="mt-4 max-w-lg text-lg leading-8 text-muted">Answer a few questions about budget, seats, fuel and how you drive. We shortlist five real cars, explain why each fits, and tell you plainly where each falls short.</p>
              <Link href="/discover" className={buttonClass("primary", "lg", "mt-8")}>Find My Car <ArrowRight size={20} weight="bold" /></Link>
            </div>
            <ol className="space-y-5">
              {[
                ["Hard requirements first", "Budget, seats, fuel and body style remove cars. We never bend them to fill the list."],
                ["Ranked on published figures", "NCAP stars, claimed efficiency, power, boot size and clearance, not invented ratings."],
                ["Every claim traceable", "Open any car to see each fact’s source, retrieval date and photo credit."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">{i + 1}</span>
                  <div><p className="font-semibold">{t}</p><p className="mt-0.5 text-sm leading-6 text-muted">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
    </>
  );
}
