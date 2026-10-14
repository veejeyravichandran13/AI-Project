import type { ReactNode } from "react";
import type { Car, Fact } from "@/types/car";
import { NOT_AVAILABLE } from "@/lib/formatters";
import { Cite } from "./cite";

export function FactRow({ car, label, fact, fmt }: { car: Car; label: string; fact: Fact<number | string> | null | undefined; fmt?: (v: number | string) => string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tnum text-right text-[15px] font-medium">
        {fact ? (<>{fmt ? fmt(fact.v) : String(fact.v)}<Cite car={car} id={fact.s} /></>) : <span className="font-normal text-muted">{NOT_AVAILABLE}</span>}
      </dd>
    </div>
  );
}

export function PlainRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}

export function Panel({ title, children, note, className }: { title: string; children: ReactNode; note?: string; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-surface p-5 sm:p-6 ${className ?? ""}`}>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <dl className="mt-2">{children}</dl>
      {note ? <p className="mt-3 text-xs leading-5 text-muted">{note}</p> : null}
    </section>
  );
}
