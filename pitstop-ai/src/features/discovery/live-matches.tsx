"use client";

import { useDeferredValue, useMemo } from "react";
import Link from "next/link";
import type { Requirements } from "@/types/recommendation";
import { useCatalogue } from "@/lib/queries";
import { buildMetricContext } from "@/lib/catalogue/metrics";
import { defaultAssumptions } from "@/lib/calculations/ownership";
import { recommend } from "@/lib/calculations/recommend";
import { carName } from "@/lib/catalogue";
import { CarPhoto } from "@/components/cars/car-photo";
import { Skeleton } from "@/components/feedback/loading-skeleton";

/** Live preview: recomputes the real hard-constraint filter and top picks as the answers change. */
export function LiveMatches({ values }: { values: Requirements }) {
  const { data } = useCatalogue();
  const deferred = useDeferredValue(values);
  const result = useMemo(() => {
    if (!data || !Number.isFinite(deferred.annualKm)) return null;
    return recommend(data.models, deferred, buildMetricContext(data.models, defaultAssumptions(deferred)), 3);
  }, [data, deferred]);

  if (!data || !result) return <Skeleton className="h-48" />;
  const cars = result.matches.map((m) => data.models.find((c) => c.id === m.carId)).filter((c) => c !== undefined);

  return (
    <div aria-live="polite">
      <p className="text-sm text-muted">Cars meeting your firm requirements</p>
      <p className="tnum font-display text-5xl font-semibold leading-none">{result.eligibleCount}<span className="ml-2 text-lg font-normal text-muted">of {data.models.length}</span></p>
      {cars.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {cars.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3">
              <CarPhoto car={c} className="h-12 w-20 shrink-0 rounded-lg" />
              <div className="min-w-0 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-muted">{i === 0 ? "Leading right now" : `Also in the running`}</p>
                <Link href={`/cars/${c.id}`} className="block truncate font-medium hover:underline">{carName(c)}</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-warn-soft p-3 text-sm leading-6">No car meets everything yet. Loosen the budget, seats or fuel and this will fill in.</p>
      )}
      <p className="mt-4 text-xs leading-5 text-muted">Preview only. The final ranking also weighs your priorities and driving pattern.</p>
    </div>
  );
}
