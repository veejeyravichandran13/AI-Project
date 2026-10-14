"use client";

import { Slider } from "radix-ui";
import { BUDGET_BOUNDS } from "@/lib/constants";
import { formatLakh } from "@/lib/formatters";

const { minLakh: LO, maxLakh: HI } = BUDGET_BOUNDS;

/** Prices span ₹3 lakh to ₹3 crore, so the slider is logarithmic: fine steps where most cars are. */
const niceStep = (v: number) => (v < 20 ? 0.5 : v < 50 ? 1 : v < 100 ? 5 : 10);
export const posToLakh = (pos: number) => {
  const raw = LO * Math.pow(HI / LO, pos / 100);
  const step = niceStep(raw);
  return Math.min(HI, Math.max(LO, Math.round(raw / step) * step));
};
export const lakhToPos = (lakh: number) => (100 * Math.log(Math.max(LO, lakh) / LO)) / Math.log(HI / LO);

interface Props {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  error?: string;
  /** Hide the large readout when the slider sits in a compact filter panel. */
  compact?: boolean;
  idPrefix?: string;
}

/** Two-thumb range slider; Radix prevents the thumbs from crossing, so min can never exceed max. */
export function BudgetRangeSlider({ min, max, onChange, error, compact }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4" aria-live="polite">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">From</p>
          <p className={`tnum font-display font-semibold ${compact ? "text-xl" : "text-3xl"}`}>{formatLakh(min)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Up to</p>
          <p className={`tnum font-display font-semibold ${compact ? "text-xl" : "text-3xl"}`}>{max >= HI ? `${formatLakh(HI)}+` : formatLakh(max)}</p>
        </div>
      </div>
      <Slider.Root
        className="relative flex h-10 w-full touch-none select-none items-center"
        min={0}
        max={100}
        step={0.5}
        minStepsBetweenThumbs={2}
        value={[lakhToPos(min), lakhToPos(max)]}
        onValueChange={([a, b]) => onChange(posToLakh(a), posToLakh(b))}
        aria-label="Price range"
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-line">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        {["Minimum price", "Maximum price"].map((label) => (
          <Slider.Thumb key={label} aria-label={label} className="block size-6 rounded-full border-2 border-accent bg-surface shadow-md transition-transform hover:scale-110 active:scale-95" />
        ))}
      </Slider.Root>
      <div className="flex justify-between text-[11px] text-muted">
        <span>{formatLakh(LO)}</span>
        <span>{formatLakh(HI)}</span>
      </div>
      {!compact ? <p className="text-sm leading-6 text-muted">Ex-showroom prices in lakh rupees (₹1 lakh = ₹1,00,000; 100 lakh = ₹1 crore). On-road costs such as registration and insurance add roughly 12–25% and vary by state.</p> : null}
      {error ? <p role="alert" className="text-sm font-medium text-bad">{error}</p> : null}
    </div>
  );
}
