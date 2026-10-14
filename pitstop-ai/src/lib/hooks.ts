"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore, selectAssumptions } from "@/store/use-app-store";
import { defaultOption } from "@/lib/catalogue";
import type { Car } from "@/types/car";
import type { Pick } from "@/lib/queries";

/** Effective Cost Lab / comparison assumptions: defaults from confirmed requirements plus edits. */
export function useAssumptions() {
  const submitted = useAppStore((s) => s.submitted);
  const overrides = useAppStore((s) => s.assumptionOverrides);
  return useMemo(() => selectAssumptions({ submitted, assumptionOverrides: overrides }), [submitted, overrides]);
}

/** Picks (car + engine option) for the given ids, honouring the user's choice per car. */
export function usePicks(ids: string[], cars: Car[] | undefined): Pick[] {
  const optionByCar = useAppStore((s) => s.optionByCar);
  return useMemo(() => {
    if (!cars) return [];
    return ids.flatMap((id) => {
      const car = cars.find((c) => c.id === id);
      if (!car) return [];
      const chosen = car.options.find((o) => o.id === optionByCar[id]);
      return [{ carId: id, optionId: (chosen ?? defaultOption(car)).id }];
    });
  }, [ids, cars, optionByCar]);
}

/**
 * False during server rendering and the first client render. Views that render query data gate on
 * this so the first client render matches the server HTML even if the data arrives before hydration.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
