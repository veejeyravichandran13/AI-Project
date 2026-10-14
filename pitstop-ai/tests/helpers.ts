import raw from "@/data/generated/catalogue.json";
import type { Car, Catalogue } from "@/types/car";
import type { Requirements } from "@/types/recommendation";
import { DEFAULT_REQUIREMENTS } from "@/data/discovery-options";
import { buildMetricContext } from "@/lib/catalogue/metrics";
import { defaultAssumptions } from "@/lib/calculations/ownership";

export const catalogue = raw as unknown as Catalogue;
export const car = (id: string): Car => {
  const c = catalogue.models.find((m) => m.id === id);
  if (!c) throw new Error(`fixture car missing: ${id}`);
  return c;
};
export const anyCar = (pred: (c: Car) => boolean): Car => {
  const c = catalogue.models.find(pred);
  if (!c) throw new Error("no car matches predicate");
  return c;
};
export const req = (patch: Partial<Requirements> = {}): Requirements => ({ ...DEFAULT_REQUIREMENTS, budgetMinLakh: 3, budgetMaxLakh: 300, minSeats: 4, ...patch });
export const ctxFor = (r: Requirements) => buildMetricContext(catalogue.models, defaultAssumptions(r));
