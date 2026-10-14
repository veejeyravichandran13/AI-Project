"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { SmartSearchBox } from "./smart-search-box";
import { buttonClass } from "@/components/ui/button";
import { TAGLINE } from "@/lib/constants";

export interface Slide {
  id: string;
  name: string;
  price: string;
  src: string;
  alt: string;
  author: string;
  license: string;
  filePageUrl: string;
}

export interface Stat {
  value: number;
  label: string;
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export function HeroShowcase({ slides, stats }: { slides: Slide[]; stats: Stat[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i];

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden bg-black text-white">
      {/* Photo stack. The first slide is in the server HTML so the hero is never empty. */}
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          {s ? (
            <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} fetchPriority="high" className="kenburns h-full w-full object-cover" />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </div>

      <div className="mx-auto w-full max-w-[88rem] px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pb-14">
        <p className="rise-in mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur" style={{ "--i": 0 } as React.CSSProperties}>
          <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" /> New cars in India · every fact sourced
        </p>
        <h1 className="rise-in max-w-4xl font-display text-[2.9rem] font-semibold leading-[0.98] sm:text-7xl lg:text-[5.75rem]" style={{ "--i": 1 } as React.CSSProperties}>
          Find the car that <span className="text-accent">fits your life.</span>
        </h1>
        <p className="rise-in mt-6 max-w-xl text-lg leading-8 text-white/75" style={{ "--i": 2 } as React.CSSProperties}>
          {TAGLINE} Explore real models from every major manufacturer with sourced specs, prices and safety ratings, then let us shortlist five that suit how you drive.
        </p>
        <div className="rise-in mt-8 max-w-2xl" style={{ "--i": 3 } as React.CSSProperties}>
          <SmartSearchBox />
        </div>
        <div className="rise-in mt-6 flex flex-wrap items-center gap-3" style={{ "--i": 4 } as React.CSSProperties}>
          <Link href="/discover" className={buttonClass("primary", "lg")}>Find My Car <ArrowRight size={20} weight="bold" /></Link>
          <Link href="/cars" className={buttonClass("secondary", "lg", "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white")}>Explore all cars</Link>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((st) => (
              <div key={st.label}>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/55">{st.label}</dt>
                <dd className="tnum font-display text-4xl font-semibold"><CountUp to={st.value} /></dd>
              </div>
            ))}
          </dl>
          {s ? (
            <div className="max-w-sm text-sm sm:text-right">
              <p className="text-white/55">Now showing</p>
              <p className="mt-0.5 text-base font-medium">
                <Link href={`/cars/${s.id}`} className="underline-offset-4 hover:underline">{s.name}</Link> <span className="text-white/65">· from {s.price}</span>
              </p>
              <p className="mt-1 text-[11px] leading-4 text-white/50">
                Photo: <a className="underline underline-offset-2 hover:text-white" href={s.filePageUrl} target="_blank" rel="noopener noreferrer">{s.author.length > 40 ? `${s.author.slice(0, 38)}…` : s.author}</a>, {s.license}
              </p>
              {slides.length > 1 ? (
                <div className="mt-3 flex gap-1.5 sm:justify-end" role="tablist" aria-label="Choose featured car">
                  {slides.map((x, k) => (
                    <button key={x.id} type="button" role="tab" aria-selected={k === i} aria-label={`Show ${x.name}`} onClick={() => setI(k)} className="flex h-6 w-8 items-center justify-center">
                      <span className={`h-1 w-full rounded-full transition-colors ${k === i ? "bg-accent" : "bg-white/30"}`} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
