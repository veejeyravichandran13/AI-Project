"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brands/brand-logo";
import Link from "next/link";
import { ArrowSquareOut, BatteryCharging, CarProfile, Gauge, Package, Ruler, ShieldCheck, Sparkle, Tag, UsersThree, Warning } from "@phosphor-icons/react";
import type { Car, Option } from "@/types/car";
import { MockApiError } from "@/lib/mock-api";
import { useAppStore } from "@/store/use-app-store";
import { useAssumptions, useMounted } from "@/lib/hooks";
import { useCar, useCarFit, useCatalogue } from "@/lib/queries";
import { BODY_LABEL, FUEL_LABEL, SEGMENT_LABEL, bestEvRange, carMaxPrice, carMinPrice, carName, defaultOption, getOption, powerRange, segmentOf } from "@/lib/catalogue";
import { estimateOwnership } from "@/lib/calculations/ownership";
import { filterCars } from "@/lib/catalogue";
import { formatDate, formatInr, formatNumber, formatPriceCompact, formatPriceRange } from "@/lib/formatters";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { DetailSkeleton, Skeleton } from "@/components/feedback/loading-skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { CarPhoto } from "@/components/cars/car-photo";
import { Stars } from "@/components/cars/ncap";
import { Cite } from "@/components/cars/cite";
import { FactRow, Panel, PlainRow } from "@/components/cars/fact-row";
import { DimensionDiagram } from "@/components/cars/dimension-diagram";
import { CarCard } from "@/components/cars/car-card";
import { CompareToggleButton, ShortlistButton } from "@/components/cars/car-actions";
import { FitReasonList, TradeoffPanel } from "@/components/recommendations/fit-lists";
import { OwnershipCostCard } from "@/components/ownership/ownership-cost-card";

const mm = (v: number | string) => `${formatNumber(Number(v), 0)} mm`;

export function CarDetailView({ carId }: { carId: string }) {
  const q = useCar(carId);
  const mounted = useMounted();
  useEffect(() => track({ name: "vehicle_viewed", vehicleId: carId }), [carId]);

  if (!mounted || q.isPending) return <Container className="py-10"><DetailSkeleton /></Container>;
  if (q.isError) {
    return (
      <Container className="py-10">
        {q.error instanceof MockApiError && q.error.code === "NOT_FOUND" ? (
          <EmptyState icon={<CarProfile size={28} weight="duotone" />} title="We could not find that car" message="It is not in the catalogue. The link may be out of date." action={<Button href="/cars">Explore all cars</Button>} />
        ) : (
          <ErrorState title="Could not load this car" message={q.error.message} onRetry={() => void q.refetch()} busy={q.isFetching} />
        )}
      </Container>
    );
  }
  return <Detail car={q.data} />;
}

const SECTIONS = [["overview", "Overview"], ["engines", "Engines"], ["specs", "Dimensions"], ["safety", "Safety"], ["price", "Price"], ["sources", "Sources"]] as const;

function StatTile({ icon, label, value, sub, cite }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; cite?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-xs text-muted">{icon}{label}</p>
      <p className="tnum mt-2 font-display text-2xl font-semibold leading-tight">{value}{cite}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function Detail({ car }: { car: Car }) {
  const requirements = useAppStore((s) => s.submitted);
  const hydrated = useAppStore((s) => s.hydrated);
  const optionByCar = useAppStore((s) => s.optionByCar);
  const setOption = useAppStore((s) => s.setOption);
  const addToCompare = useAppStore((s) => s.addToCompare);
  const assumptions = useAssumptions();
  const catalogue = useCatalogue();
  const [photo, setPhoto] = useState(0);

  const option = getOption(car, optionByCar[car.id] ?? defaultOption(car).id);
  const name = carName(car);
  const fit = useCarFit(car.id, requirements, option.id);
  const estimate = useMemo(() => estimateOwnership(car, option, assumptions), [car, option, assumptions]);
  const brandSlug = catalogue.data?.brands.find((b) => b.name === car.brand)?.slug;
  const power = powerRange(car);
  const evRange = bestEvRange(car);
  const ncap = car.safety.ncap;
  const priceSrc = car.sources.find((s) => s.id === car.price.minInr.s);

  const maxPs = useMemo(() => Math.max(1, ...(catalogue.data?.models.flatMap((m) => m.options.map((o) => o.powerPs?.v ?? 0)) ?? [1])), [catalogue.data]);
  const maxNm = useMemo(() => Math.max(1, ...(catalogue.data?.models.flatMap((m) => m.options.map((o) => o.torqueNm?.v ?? 0)) ?? [1])), [catalogue.data]);
  const similar = useMemo(() => {
    if (!catalogue.data) return [];
    const lo = carMinPrice(car) * 0.7;
    const hi = carMaxPrice(car) * 1.3;
    return filterCars(catalogue.data.models, { bodyTypes: [car.bodyType], minPriceInr: lo, maxPriceInr: hi }).filter((c) => c.id !== car.id).sort((a, b) => Math.abs(carMinPrice(a) - carMinPrice(car)) - Math.abs(carMinPrice(b) - carMinPrice(car))).slice(0, 3);
  }, [catalogue.data, car]);

  return (
    <article>
      {/* Hero */}
      <header className="relative isolate overflow-hidden bg-black text-white">
        <div className="absolute inset-0 -z-10">
          <CarPhoto car={car} index={photo} size="full" className="h-full w-full" imgClassName="kenburns" priority credit />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
        </div>
        <Container className="flex min-h-[26rem] max-w-[88rem] flex-col justify-end pb-20 pt-24 sm:min-h-[34rem] lg:min-h-[38rem]">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white/65">
            <Link href="/cars" className="hover:text-white">Explore</Link><span aria-hidden="true">/</span>
            <Link href={brandSlug ? `/brands/${brandSlug}` : "/brands"} className="hover:text-white">{car.brand}</Link><span aria-hidden="true">/</span>
            <span aria-current="page" className="text-white">{car.model}</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-white/70"><BrandLogo name={car.brand} logo={car.brandLogo} className="h-8 w-14 shrink-0 text-[8px]" pad="px-1.5 py-1" />{car.brand}</p>
              <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-7xl">{car.model}</h1>
              <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">{car.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className="border-white/25 bg-white/10 text-white">{BODY_LABEL[car.bodyType]}</Badge>
                <Badge className="border-white/25 bg-white/10 text-white">{SEGMENT_LABEL[segmentOf(car)]} by price</Badge>
                {car.generation ? <Badge className="border-white/25 bg-white/10 text-white">{car.generation}</Badge> : null}
              </div>
            </div>
            <div className="glass min-w-60 rounded-3xl p-5 text-ink">
              <p className="text-xs text-muted">Ex-showroom, {car.price.location}</p>
              <p className="tnum font-display text-3xl font-semibold">{formatPriceRange(carMinPrice(car), carMaxPrice(car))}<Cite car={car} id={car.price.minInr.s} /></p>
              <div className="mt-4 flex flex-wrap items-center gap-2 no-print">
                <CompareToggleButton carId={car.id} name={name} size="sm" />
                <ShortlistButton carId={car.id} name={name} />
              </div>
            </div>
          </div>
          {car.images.length > 1 ? (
            <div className="mt-6 flex gap-2" role="tablist" aria-label="Photos">
              {car.images.map((im, i) => (
                <button key={im.file} role="tab" aria-selected={i === photo} aria-label={`Photo ${i + 1}: ${im.caption}`} onClick={() => setPhoto(i)} className={cn("h-14 w-24 overflow-hidden rounded-xl border-2 transition-opacity", i === photo ? "border-accent" : "border-transparent opacity-70 hover:opacity-100")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.thumbPath} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </Container>
      </header>

      {/* Sticky section nav */}
      <div className="sticky top-16 z-30 border-b border-line bg-bg/85 backdrop-blur-xl no-print">
        <Container className="max-w-[88rem]">
          <nav aria-label="On this page" className="hide-scrollbar flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">{label}</a>)}
          </nav>
        </Container>
      </div>

      <Container className="max-w-[88rem] space-y-16 py-12 sm:space-y-24 sm:py-16">
        {/* Overview */}
        <section id="overview" className="scroll-mt-32">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <StatTile icon={<Tag size={14} />} label="Starting price" value={formatPriceCompact(carMinPrice(car))} sub="ex-showroom" cite={<Cite car={car} id={car.price.minInr.s} />} />
            <StatTile icon={<Gauge size={14} />} label="Power" value={power ? `${power.min === power.max ? power.min : `${power.min}–${power.max}`} PS` : "n/a"} sub={power ? "across engines" : "Not available"} />
            <StatTile icon={<BatteryCharging size={14} />} label={evRange ? "Best claimed range" : "Best claimed efficiency"} value={evRange ? `${evRange} km` : (() => { const b = car.options.filter((o) => o.efficiency).sort((a, c) => c.efficiency!.value - a.efficiency!.value)[0]; return b?.efficiency ? `${b.efficiency.value} ${b.efficiency.unit}` : "n/a"; })()} sub="test-cycle claim" />
            <StatTile icon={<UsersThree size={14} />} label="Seats" value={car.seats.v} cite={<Cite car={car} id={car.seats.s} />} />
            <StatTile icon={<Package size={14} />} label="Boot" value={car.dimensions.bootLitres ? `${car.dimensions.bootLitres.v} L` : "n/a"} sub={car.dimensions.bootLitres ? undefined : "Not available"} cite={<Cite car={car} id={car.dimensions.bootLitres?.s} />} />
            <StatTile icon={<ShieldCheck size={14} />} label="Crash rating" value={ncap ? <Stars n={ncap.stars} size={18} /> : "Not rated"} sub={ncap ? `${ncap.body}${ncap.year ? ` ${ncap.year}` : ""}` : "No NCAP result found"} cite={<Cite car={car} id={ncap?.s} />} />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">How it fits you</h2>
            <div className="mt-6">
              {!hydrated ? <Skeleton className="h-40" /> : !requirements ? (
                <EmptyState icon={<Sparkle size={28} weight="duotone" />} title="Personalised fit needs your brief" message="Tell us your budget, seats and how you drive, and we will explain how this engine option fits, and where it does not." action={<Button href="/discover">Find My Car</Button>} />
              ) : fit.isPending ? <Skeleton className="h-56" /> : fit.isError ? (
                <ErrorState title="Could not work out your fit" message={fit.error.message} onRetry={() => void fit.refetch()} busy={fit.isFetching} />
              ) : (
                <div className="space-y-5">
                  {!fit.data.eligible ? (
                    <div role="alert" className="rounded-3xl border border-bad/30 bg-bad-soft p-5">
                      <p className="flex items-center gap-2 font-medium"><Warning size={20} weight="fill" className="text-bad" /> Outside your stated requirements</p>
                      <ul className="mt-2 list-disc pl-6 text-sm leading-6">{fit.data.violations.map((v) => <li key={v}>{v}</li>)}</ul>
                      <p className="mt-2 text-sm text-muted">The points below describe general strengths. This car would not appear in your top five for this brief.</p>
                    </div>
                  ) : <p className="text-sm text-muted">This engine option meets your budget, seating and fuel requirements.</p>}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><FitReasonList reasons={fit.data.reasons} /></div>
                    <TradeoffPanel drawbacks={fit.data.drawbacks} className="self-start p-5 sm:p-6" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Engines */}
        <section id="engines" className="scroll-mt-32">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Engines and variants</h2>
          <p className="mt-2 max-w-2xl text-muted">Choose an engine option. Power, torque and efficiency are the manufacturer’s published figures for that option.</p>
          <div role="radiogroup" aria-label="Engine option" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {car.options.map((o) => {
              const on = o.id === option.id;
              return (
                <label key={o.id} className={cn("relative flex cursor-pointer flex-col gap-1.5 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent", on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-ink/30")}>
                  <input type="radio" name="option" className="sr-only" checked={on} onChange={() => setOption(car.id, o.id)} />
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", o.fuel === "ev" ? "border-ev/40 bg-ev-soft text-ev" : "border-line bg-surface-2 text-muted")}>{FUEL_LABEL[o.fuel]}</span>
                    {on ? <Badge tone="accent">Selected</Badge> : null}
                  </span>
                  <span className="font-medium leading-snug">{o.label}</span>
                  <span className="tnum text-sm text-muted">{o.fromPriceInr ? `From ${formatPriceCompact(o.fromPriceInr.v)}` : "Price not published separately"}</span>
                </label>
              );
            })}
          </div>
          <EnginePanel car={car} option={option} maxPs={maxPs} maxNm={maxNm} />
        </section>

        {/* Dimensions */}
        <section id="specs" className="scroll-mt-32">
          <h2 className="flex items-center gap-3 font-display text-3xl font-semibold sm:text-4xl"><Ruler size={28} className="text-accent" /> Size and space</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="rounded-3xl border border-line bg-surface p-5 sm:p-8"><DimensionDiagram car={car} /></div>
            <Panel title="Published measurements">
              <FactRow car={car} label="Length" fact={car.dimensions.lengthMm} fmt={mm} />
              <FactRow car={car} label="Width" fact={car.dimensions.widthMm} fmt={mm} />
              <FactRow car={car} label="Height" fact={car.dimensions.heightMm} fmt={mm} />
              <FactRow car={car} label="Wheelbase" fact={car.dimensions.wheelbaseMm} fmt={mm} />
              <FactRow car={car} label="Ground clearance" fact={car.dimensions.groundClearanceMm} fmt={mm} />
              <FactRow car={car} label="Boot space" fact={car.dimensions.bootLitres} fmt={(v) => `${v} L`} />
              <FactRow car={car} label="Fuel tank" fact={car.dimensions.fuelTankLitres} fmt={(v) => `${v} L`} />
              <FactRow car={car} label="Kerb weight" fact={car.dimensions.kerbWeightKg} fmt={(v) => `${formatNumber(Number(v), 0)} kg`} />
              <FactRow car={car} label="Seating" fact={car.seats} fmt={(v) => `${v} seats`} />
            </Panel>
          </div>
        </section>

        {/* Safety */}
        <section id="safety" className="scroll-mt-32">
          <h2 className="flex items-center gap-3 font-display text-3xl font-semibold sm:text-4xl"><ShieldCheck size={28} className="text-accent" /> Safety</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              {ncap ? (
                <>
                  <p className="text-sm text-muted">{ncap.body}{ncap.year ? ` · ${ncap.year}` : ""}{ncap.protocol ? ` · ${ncap.protocol}` : ""}</p>
                  <div className="mt-3 flex items-center gap-4"><Stars n={ncap.stars} size={34} /><span className="font-display text-5xl font-semibold">{ncap.stars}<span className="text-2xl text-muted">/5</span></span><Cite car={car} id={ncap.s} /></div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-muted">Adult occupant</dt><dd className="mt-0.5 text-lg font-semibold">{ncap.adultOccupantStars !== null ? <Stars n={ncap.adultOccupantStars} /> : "Not stated"}</dd></div>
                    <div><dt className="text-muted">Child occupant</dt><dd className="mt-0.5 text-lg font-semibold">{ncap.childOccupantStars !== null ? <Stars n={ncap.childOccupantStars} /> : "Not stated"}</dd></div>
                  </dl>
                  {ncap.note ? <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm leading-6 text-muted">{ncap.note}</p> : null}
                </>
              ) : (
                <EmptyState title="No crash-test rating found" message="We looked for Global NCAP and Bharat NCAP results and found none for this model. That does not mean it is unsafe; it means we cannot cite a result." />
              )}
            </div>
            <Panel title="Safety equipment">
              <FactRow car={car} label="Standard airbags" fact={car.safety.airbagsStandard} />
              {car.safety.keyFeatures.length ? (
                <div className="py-3">
                  <p className="mb-2 text-sm text-muted">Features stated by the sources</p>
                  <ul className="space-y-2 text-[15px]">{car.safety.keyFeatures.map((f) => <li key={f} className="flex gap-2"><ShieldCheck size={18} weight="fill" className="mt-0.5 shrink-0 text-good" />{f}</li>)}</ul>
                </div>
              ) : <PlainRow label="Key features"><span className="font-normal text-muted">Not available</span></PlainRow>}
              <FactRow car={car} label="Warranty" fact={car.warranty} />
            </Panel>
          </div>
        </section>

        {/* Price + ownership */}
        <section id="price" className="scroll-mt-32">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Price and running cost</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
              <h3 className="font-display text-xl font-semibold">Ex-showroom price</h3>
              <p className="tnum mt-3 font-display text-4xl font-semibold">{formatPriceRange(carMinPrice(car), carMaxPrice(car))}<Cite car={car} id={car.price.minInr.s} /></p>
              <p className="mt-1 text-sm text-muted">{car.price.location} · as of {formatDate(car.price.asOf)}</p>
              {priceSrc && priceSrc.type !== "manufacturer" && priceSrc.type !== "brochure" ? (
                <p className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-sm leading-6"><Warning size={18} weight="fill" className="mt-0.5 shrink-0 text-warn" />This price comes from {priceSrc.publisher}, not the manufacturer. Confirm with a dealer, as prices change often.</p>
              ) : null}
              <h4 className="mt-6 text-sm font-semibold">By engine option</h4>
              <ul className="mt-2 divide-y divide-line text-sm">
                {car.options.map((o) => (
                  <li key={o.id} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span>{o.label}</span>
                    <span className="tnum font-medium">{o.fromPriceInr ? <>{formatInr(o.fromPriceInr.v)}<Cite car={car} id={o.fromPriceInr.s} /></> : <span className="font-normal text-muted">Not published</span>}</span>
                  </li>
                ))}
              </ul>
              {option.trims.length > 0 ? (
                <>
                  <h4 className="mt-6 text-sm font-semibold">Trims for the selected option</h4>
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {option.trims.map((t) => (
                      <li key={t.name} className="flex items-baseline justify-between gap-4 py-2.5"><span>{t.name}</span><span className="tnum font-medium">{t.priceInr ? <>{formatInr(t.priceInr.v)}<Cite car={car} id={t.priceInr.s} /></> : <span className="font-normal text-muted">Not published</span>}</span></li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
            <OwnershipCostCard estimate={estimate} assumptions={assumptions} title={`Ownership estimate · ${option.label}`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 no-print">
            <Button variant="secondary" href="/ownership" onClick={() => addToCompare(car.id)}>Open in Cost Lab</Button>
          </div>
        </section>

        {/* Sources */}
        <section id="sources" className="scroll-mt-32">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Sources and credits</h2>
          <p className="mt-2 max-w-2xl text-muted">Every number above carries a bracketed number pointing here. Open the original to check it yourself.</p>
          <ol className="mt-6 grid gap-3 lg:grid-cols-2">
            {car.sources.map((s, i) => (
              <li key={s.id} id={`source-${s.id}`} className="scroll-mt-36 rounded-2xl border border-line bg-surface p-4 target:border-accent">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">{i + 1}</span>
                  <Badge tone={s.type === "manufacturer" || s.type === "brochure" ? "good" : s.type === "ncap" ? "good" : "neutral"}>{s.type === "ncap" ? "NCAP" : s.type === "third-party" ? "Third-party" : s.type === "wikipedia" ? "Wikipedia" : s.type === "brochure" ? "Official brochure" : "Manufacturer"}</Badge>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-start gap-1.5 font-medium underline-offset-2 hover:underline">{s.label}<ArrowSquareOut size={14} className="mt-1 shrink-0 text-muted" /></a>
                <p className="mt-1 text-sm text-muted">{s.publisher} · retrieved {formatDate(s.retrievedAt)}{s.publishedAt ? ` · published ${formatDate(s.publishedAt)}` : ""}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a href={car.officialUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>Official {car.brand} page <ArrowSquareOut size={14} /></a>
            {car.wikipediaUrl ? <a href={car.wikipediaUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>Wikipedia <ArrowSquareOut size={14} /></a> : null}
          </div>
          {car.images.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-display text-xl font-semibold">Photo credits</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {car.images.map((im) => (
                  <li key={im.file}>
                    <a className="text-ink underline underline-offset-2" href={im.filePageUrl} target="_blank" rel="noopener noreferrer">{im.caption}</a> by {im.author}, {im.licenseUrl ? <a className="underline underline-offset-2" href={im.licenseUrl} target="_blank" rel="noopener noreferrer">{im.license}</a> : im.license}, via Wikimedia Commons.
                    {im.match !== "exact" ? <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs text-warn">{im.match === "same-model-other-market" ? "Shows another market’s version" : "Shows another generation"}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {car.notes.length > 0 ? (
            <div className="mt-8 rounded-2xl bg-surface-2 p-5">
              <h3 className="font-semibold">Notes on this record</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">{car.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          ) : null}
        </section>

        {similar.length > 0 ? (
          <section aria-labelledby="similar-h">
            <h2 id="similar-h" className="font-display text-3xl font-semibold sm:text-4xl">Similar cars</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((c, i) => <li key={c.id}><CarCard car={c} index={i} className="h-full" /></li>)}</ul>
          </section>
        ) : null}
      </Container>
    </article>
  );
}

function Meter({ label, value, max, unit, cite }: { label: string; value: number | undefined; max: number; unit: string; cite: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tnum font-semibold">{value !== undefined ? `${formatNumber(value, 0)} ${unit}` : <span className="font-normal text-muted">Not available</span>}{cite}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={value !== undefined ? `${label}: ${value} ${unit} out of a catalogue maximum of ${max}` : `${label} not available`}>
        {value !== undefined ? <div className="h-full rounded-full bg-gradient-to-r from-accent to-[color-mix(in_srgb,var(--accent)_55%,white)]" style={{ width: `${Math.max(3, (value / max) * 100)}%` }} /> : null}
      </div>
    </div>
  );
}

function EnginePanel({ car, option, maxPs, maxNm }: { car: Car; option: Option; maxPs: number; maxNm: number }) {
  const ev = option.ev;
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6" aria-label={`Specifications for ${option.label}`}>
        <h3 className="font-display text-xl font-semibold">{option.label}</h3>
        <div className="mt-5 space-y-5">
          <Meter label="Power" value={option.powerPs?.v} max={maxPs} unit="PS" cite={<Cite car={car} id={option.powerPs?.s} />} />
          <Meter label="Torque" value={option.torqueNm?.v} max={maxNm} unit="Nm" cite={<Cite car={car} id={option.torqueNm?.s} />} />
        </div>
        <p className="mt-3 text-xs text-muted">Bars show this option against the highest value in the whole catalogue.</p>
      </section>
      <Panel title="Engine and drivetrain" note={option.efficiency ? `Efficiency is the manufacturer’s claimed ${option.efficiency.basis} figure. Real-world numbers are usually lower.` : undefined}>
        <PlainRow label="Fuel">{FUEL_LABEL[option.fuel]}</PlainRow>
        <PlainRow label={option.fuel === "ev" ? "Motor" : "Engine"}>{option.engine}</PlainRow>
        {option.displacementCc ? <FactRow car={car} label="Displacement" fact={option.displacementCc} fmt={(v) => `${formatNumber(Number(v), 0)} cc`} /> : null}
        {option.cylinders ? <PlainRow label="Cylinders">{option.cylinders}</PlainRow> : null}
        <PlainRow label="Transmission">{option.transmission}</PlainRow>
        <FactRow car={car} label="Power" fact={option.powerPs} fmt={(v) => `${v} PS`} />
        <FactRow car={car} label="Torque" fact={option.torqueNm} fmt={(v) => `${v} Nm`} />
        {option.fuel !== "ev" ? (
          <PlainRow label="Claimed efficiency">{option.efficiency ? <>{option.efficiency.value} {option.efficiency.unit} ({option.efficiency.basis})<Cite car={car} id={option.efficiency.s} /></> : <span className="font-normal text-muted">Not available</span>}</PlainRow>
        ) : null}
        {ev ? (
          <>
            <FactRow car={car} label="Battery" fact={ev.batteryKwh} fmt={(v) => `${v} kWh`} />
            <FactRow car={car} label={`Claimed range${ev.rangeStandard ? ` (${ev.rangeStandard})` : ""}`} fact={ev.claimedRangeKm} fmt={(v) => `${v} km`} />
            <FactRow car={car} label="AC charging" fact={ev.acChargeNote} />
            <FactRow car={car} label="DC fast charging" fact={ev.dcFastChargeNote} />
          </>
        ) : null}
      </Panel>
    </div>
  );
}
