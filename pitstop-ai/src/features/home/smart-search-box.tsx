"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { useCatalogue } from "@/lib/queries";
import { parseSmartSearch } from "@/lib/smart-search";
import { filtersToParams } from "@/lib/filters-url";
import { cn } from "@/lib/utils/cn";

const EXAMPLES = ["7-seater diesel SUV under 20 lakh", "safe EV under 25 lakh", "automatic hatchback around 8 lakh", "Tata or Mahindra SUV under 15 lakh"];

/** Describe what you want in plain words. A rules-based parser maps it to filters; no AI service is called. */
export function SmartSearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const { data } = useCatalogue();
  const [text, setText] = useState("");

  const run = (value: string) => {
    const v = value.trim();
    if (!v) return router.push("/cars");
    const parsed = data ? parseSmartSearch(v, data.brands, data.models.map((m) => m.model)) : { filters: { query: v }, understood: [], leftover: "" };
    const params = filtersToParams(parsed.understood.length || parsed.filters.query ? parsed.filters : { query: v });
    router.push(`/cars?${params}`);
  };

  const preview = data && text.trim().length > 2 ? parseSmartSearch(text, data.brands, data.models.map((m) => m.model)).understood : [];

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text);
        }}
        role="search"
        className="glass group flex items-center gap-2 rounded-full p-1.5 pl-5 shadow-[var(--shadow-pop)] transition-colors focus-within:border-accent/60"
      >
        <Sparkle size={20} weight="fill" className="shrink-0 text-accent" aria-hidden="true" />
        <label htmlFor="smart-search" className="sr-only">Describe the car you want</label>
        <input
          id="smart-search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your car: 7-seater diesel SUV under 20 lakh"
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/80 sm:text-base"
          autoComplete="off"
        />
        <button type="submit" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-transform hover:brightness-110 active:scale-95">
          <span className="hidden sm:inline">Show cars</span> <ArrowRight size={18} weight="bold" />
        </button>
      </form>
      <div className="mt-3 min-h-8" aria-live="polite">
        {preview.length > 0 ? (
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-white/80">
            <span className="text-white/60">Understood:</span>
            {preview.map((p) => <span key={p} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white">{p}</span>)}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <li key={ex}>
                <button type="button" onClick={() => { setText(ex); run(ex); }} className={cn("rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur transition-colors hover:bg-white/20")}>
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
