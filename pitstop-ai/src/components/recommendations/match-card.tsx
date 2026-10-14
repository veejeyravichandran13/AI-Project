"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brands/brand-logo";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CaretDown, Info, SlidersHorizontal } from "@phosphor-icons/react";
import type { Car } from "@/types/car";
import type { Match } from "@/types/recommendation";
import type { Metrics } from "@/lib/catalogue/metrics";
import { BODY_LABEL, FUEL_LABEL, carName, efficiencyLabel, getOption, optionPriceRange } from "@/lib/catalogue";
import { formatPriceCompact } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { CarPhoto } from "@/components/cars/car-photo";
import { NcapBadge } from "@/components/cars/ncap";
import { CompareToggleButton, ShortlistButton } from "@/components/cars/car-actions";
import { FitReasonList, TradeoffPanel } from "./fit-lists";
import { cn } from "@/lib/utils/cn";

const FIT_LABEL = { strong: "Strong fit for your brief", good: "Good fit for your brief", reasonable: "Reasonable fit with compromises" } as const;

const METRIC_ROWS: { key: keyof Metrics; label: string }[] = [
  { key: "safety", label: "Crash safety" },
  { key: "efficiency", label: "Running cost" },
  { key: "performance", label: "Power" },
  { key: "space", label: "Space" },
  { key: "groundClearance", label: "Clearance" },
];

function MetricBars({ metrics }: { metrics: Metrics }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">How it ranks on published figures</p>
      <ul className="space-y-2.5">
        {METRIC_ROWS.map(({ key, label }) => {
          const v = metrics[key] as number | null;
          return (
            <li key={key} className="grid grid-cols-[6.5rem_1fr_2.2rem] items-center gap-3 text-xs">
              <span className="text-muted">{label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={v === null ? `${label}: figure not published` : `${label}: ${v.toFixed(1)} out of 10 compared with the catalogue`}>
                {v !== null ? <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, v * 10)}%` }} /> : null}
              </span>
              <span className="tnum text-right text-muted">{v === null ? "n/a" : v.toFixed(1)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] leading-4 text-muted">Percentile among all catalogue cars (10 = best). “n/a” means the figure was not published.</p>
    </div>
  );
}

export function MatchCard({ match, car, metrics, index }: { match: Match; car: Car; metrics: Metrics | null; index: number }) {
  const option = getOption(car, match.optionId);
  const [expanded, setExpanded] = useState(false);
  const name = carName(car);
  const price = optionPriceRange(car, option);
  const eff = efficiencyLabel(option);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 2) * 0.05 }}
      aria-labelledby={`m-${car.id}`}
      className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4 p-3 sm:p-4 lg:p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Link href={`/cars/${car.id}`} aria-label={`View details for ${name}`} className="absolute inset-0 block">
              <CarPhoto car={car} size="full" credit className="h-full w-full" />
            </Link>
            <span className="pointer-events-none absolute left-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-black/70 font-display text-xl font-semibold text-white backdrop-blur"><span className="sr-only">Match number </span>{match.rank}</span>
          </div>
          {metrics ? <MetricBars metrics={metrics} /> : null}
        </div>

        <div className="space-y-5 p-5 sm:p-8 lg:pl-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={match.fit === "reasonable" ? "warn" : "good"}>{FIT_LABEL[match.fit]}</Badge>
              <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"><BrandLogo name={car.brand} logo={car.brandLogo} className="h-6 w-11 shrink-0 text-[7px]" pad="px-1 py-0.5" />{car.brand}</p>
              <h3 id={`m-${car.id}`} className="font-display text-4xl font-semibold leading-none">{car.model}</h3>
              <p className="mt-2 text-sm text-muted">{BODY_LABEL[car.bodyType]} · {option.label}</p>
            </div>
            <div className="flex items-start gap-1">
              <div className="text-right">
                <p className="tnum font-display text-3xl font-semibold">{formatPriceCompact(price.min)}</p>
                <p className="text-xs text-muted">{price.exact ? "ex-showroom for this engine" : "model starting price"}</p>
              </div>
              <ShortlistButton carId={car.id} name={name} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line p-4 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-muted">Fuel</dt><dd className="font-medium">{FUEL_LABEL[option.fuel]}</dd></div>
            <div><dt className="text-xs text-muted">Power</dt><dd className="tnum font-medium">{option.powerPs ? `${option.powerPs.v} PS` : "n/a"}</dd></div>
            <div><dt className="text-xs text-muted">{option.fuel === "ev" ? "Claimed range" : "Claimed efficiency"}</dt><dd className="tnum font-medium">{eff ?? "n/a"}</dd></div>
            <div><dt className="text-xs text-muted">Safety</dt><dd><NcapBadge car={car} compact /></dd></div>
          </dl>

          <FitReasonList reasons={match.reasons} collapsedAfter={expanded ? undefined : 2} />
          <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent md:hidden">
            {expanded ? "Show fewer reasons" : "Show all five reasons"}<CaretDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
          <TradeoffPanel drawbacks={match.drawbacks} />
          <p className="flex items-start gap-2 text-xs leading-5 text-muted"><Info size={14} weight="fill" className="mt-0.5 shrink-0" />Ranked by a transparent heuristic over published figures, not a validated probability. Open the car to see the source of every number.</p>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4 no-print">
            <Link href={`/cars/${car.id}`} className={buttonClass("primary")}>View details <ArrowRight size={18} weight="bold" /></Link>
            <CompareToggleButton carId={car.id} name={name} />
            <Link href="/discover" className={buttonClass("ghost")}><SlidersHorizontal size={18} /> Adjust requirements</Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
