"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge, Lightning, UsersThree } from "@phosphor-icons/react";
import type { Car } from "@/types/car";
import { BODY_LABEL, FUEL_LABEL, bestEvRange, carMaxPrice, carMinPrice, carName, fuelsOf, powerRange } from "@/lib/catalogue";
import { formatNumber, formatPriceRange } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/brands/brand-logo";
import { CarPhoto } from "./car-photo";
import { NcapBadge } from "./ncap";
import { CompareToggleButton, ShortlistButton } from "./car-actions";

function bestMileage(car: Car): string | null {
  const o = car.options.filter((x) => x.efficiency && x.fuel !== "ev").sort((a, b) => b.efficiency!.value - a.efficiency!.value)[0];
  return o?.efficiency ? `${o.efficiency.value} ${o.efficiency.unit}` : null;
}

export function CarCard({ car, index = 0, className }: { car: Car; index?: number; className?: string }) {
  const name = carName(car);
  const power = powerRange(car);
  const range = bestEvRange(car);
  const mileage = bestMileage(car);
  const fuels = fuelsOf(car);
  const spec = [
    power ? { icon: <Gauge size={15} />, text: `${formatNumber(power.min, 0)}${power.max !== power.min ? `–${formatNumber(power.max, 0)}` : ""} PS` } : null,
    mileage ? { icon: <Lightning size={15} className="rotate-0" />, text: mileage } : range ? { icon: <Lightning size={15} />, text: `${range} km` } : null,
    { icon: <UsersThree size={15} />, text: `${car.seats.v} seats` },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index % 6, 5) * 0.04 }}
      className={cn("group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent/50", className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CarPhoto car={car} className="h-full w-full" imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{BODY_LABEL[car.bodyType]}</span>
        <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5">
          <ShortlistButton carId={car.id} name={name} onPhoto />
          <CompareToggleButton carId={car.id} name={name} iconOnly />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"><BrandLogo name={car.brand} logo={car.brandLogo} className="h-6 w-11 shrink-0 text-[7px]" pad="px-1 py-0.5" />{car.brand}</p>
          <h3 className="font-display text-2xl font-semibold leading-tight">
            <Link href={`/cars/${car.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-accent">
              {car.model}
            </Link>
          </h3>
        </div>
        <p className="tnum font-mono text-[15px] font-medium">{formatPriceRange(carMinPrice(car), carMaxPrice(car))}<span className="ml-1.5 font-sans text-[11px] font-normal text-muted">ex-showroom</span></p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
          {spec.map((s) => (
            <li key={s.text} className="inline-flex items-center gap-1.5">{s.icon}<span className="tnum">{s.text}</span></li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <ul className="flex flex-wrap gap-1.5" aria-label="Fuel types">
            {fuels.slice(0, 4).map((f) => (
              <li key={f} className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", f === "ev" ? "border-ev/40 bg-ev-soft text-ev" : "border-line bg-surface-2 text-muted")}>{FUEL_LABEL[f]}</li>
            ))}
          </ul>
          <NcapBadge car={car} compact />
        </div>
      </div>
    </motion.article>
  );
}
