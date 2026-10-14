"use client";

import { useEffect, useState } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import type { OwnershipAssumptions } from "@/types/ownership";
import { STATES } from "@/data/locations";
import { useAppStore, selectAssumptions } from "@/store/use-app-store";
import { SelectField } from "@/components/forms/select-field";
import { FieldShell, controlClass, describedBy } from "@/components/forms/field-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { KM_BOUNDS } from "@/lib/constants";

interface NumProps {
  id: string;
  label: string;
  value: number;
  onCommit: (v: number) => void;
  unit: string;
  step?: number;
  min: number;
  max: number;
  help: string;
  edited: boolean;
}

function NumberAssumption({ id, label, value, onCommit, unit, step = 1, min, max, help, edited }: NumProps) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState<string>();
  useEffect(() => setText(String(value)), [value]);
  return (
    <FieldShell id={id} label={label} hint={help} error={error}>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, help, error)}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value === "" || !Number.isFinite(n) || n < min || n > max) return setError(`Enter a value between ${min} and ${max}`);
            setError(undefined);
            onCommit(n);
          }}
          className={cn(controlClass, "pr-24 tabular-nums")}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-sm text-muted">
          {edited ? <Badge tone="accent" className="!px-1.5 !py-0">edited</Badge> : null}
          {unit}
        </span>
      </div>
    </FieldShell>
  );
}

export function AssumptionEditor() {
  const submitted = useAppStore((s) => s.submitted);
  const overrides = useAppStore((s) => s.assumptionOverrides);
  const set = useAppStore((s) => s.setAssumptionOverrides);
  const reset = useAppStore((s) => s.resetAssumptions);
  const a: OwnershipAssumptions = selectAssumptions({ submitted, assumptionOverrides: overrides });
  const has = (k: keyof OwnershipAssumptions) => overrides[k] !== undefined;
  const upd = <K extends keyof OwnershipAssumptions>(k: K) => (v: OwnershipAssumptions[K]) => set({ [k]: v } as Partial<OwnershipAssumptions>);
  const maint = (k: keyof OwnershipAssumptions["maintenancePerKm"]) => (v: number) => set({ maintenancePerKm: { ...overrides.maintenancePerKm, [k]: v } as OwnershipAssumptions["maintenancePerKm"] });

  return (
    <section aria-label="Cost assumptions" className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Assumptions you can change</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Every figure feeds the estimates. Fuel and tariff values are round-number samples, not live rates.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={reset} disabled={Object.keys(overrides).length === 0}><ArrowCounterClockwise size={16} /> Reset</Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <SelectField
          id="as-state"
          label="State (sets fuel, tariff and on-road defaults)"
          value={a.stateCode}
          onChange={(code) => set({ stateCode: code, petrolPerLitre: undefined, dieselPerLitre: undefined, cngPerKg: undefined, homeTariffPerKwh: undefined, publicTariffPerKwh: undefined, onRoadLoadingPct: undefined })}
          options={[{ value: "", label: "India-wide sample estimates" }, ...STATES.map((s) => ({ value: s.code, label: s.name }))]}
          hint="Changing state resets the fuel, tariff and on-road values to that state’s samples."
        />
        <NumberAssumption id="as-km" label="Distance per year" unit="km" value={a.annualKm} min={KM_BOUNDS.min} max={KM_BOUNDS.max} step={500} edited={has("annualKm")} onCommit={upd("annualKm")} help="Higher distance magnifies the running-cost gap between cars." />
        <NumberAssumption id="as-years" label="Ownership period" unit="years" value={a.years} min={1} max={20} edited={has("years")} onCommit={upd("years")} help="Totals run over this many years, with no inflation or discounting." />
        <NumberAssumption id="as-rw" label="Real-world efficiency vs claimed" unit="%" value={Math.round(a.realWorldFactor * 100)} min={50} max={100} edited={has("realWorldFactor")} onCommit={(v) => upd("realWorldFactor")(v / 100)} help="Claims are rarely achieved. 85% is a common-sense starting point." />
        <NumberAssumption id="as-petrol" label="Petrol price" unit="₹/litre" value={a.petrolPerLitre} min={50} max={200} step={0.5} edited={has("petrolPerLitre")} onCommit={upd("petrolPerLitre")} help="Sample value, not today’s pump price. Also used for hybrids." />
        <NumberAssumption id="as-diesel" label="Diesel price" unit="₹/litre" value={a.dieselPerLitre} min={50} max={200} step={0.5} edited={has("dieselPerLitre")} onCommit={upd("dieselPerLitre")} help="Sample value, not today’s pump price." />
        <NumberAssumption id="as-cng" label="CNG price" unit="₹/kg" value={a.cngPerKg} min={30} max={200} step={0.5} edited={has("cngPerKg")} onCommit={upd("cngPerKg")} help="Sample value; CNG efficiency is claimed in km/kg." />
        <NumberAssumption id="as-home" label="Home electricity tariff" unit="₹/kWh" value={a.homeTariffPerKwh} min={1} max={30} step={0.25} edited={has("homeTariffPerKwh")} onCommit={upd("homeTariffPerKwh")} help="Blended household rate. Real slabs vary." />
        <NumberAssumption id="as-public" label="Public charging price" unit="₹/kWh" value={a.publicTariffPerKwh} min={1} max={60} step={0.5} edited={has("publicTariffPerKwh")} onCommit={upd("publicTariffPerKwh")} help="Fast chargers often cost more than slow ones." />
        <NumberAssumption id="as-share" label="EV charging done at home" unit="%" value={Math.round(a.homeChargingShare * 100)} min={0} max={100} step={5} edited={has("homeChargingShare")} onCommit={(v) => upd("homeChargingShare")(v / 100)} help="Starts from your charging-access answer." />
        <SelectField id="as-basis" label="Purchase price basis (same for every car)" value={a.priceBasis} onChange={upd("priceBasis")} options={[{ value: "ex-showroom", label: "Ex-showroom" }, { value: "on-road", label: "Indicative on-road (ex-showroom + loading)" }]} hint="One basis applies to all cars so comparisons stay fair." />
        <NumberAssumption id="as-loading" label="On-road loading" unit="%" value={a.onRoadLoadingPct} min={0} max={60} step={0.5} edited={has("onRoadLoadingPct")} onCommit={upd("onRoadLoadingPct")} help="Registration, road tax and insurance combined. A rough sample." />
      </div>
      <h3 className="mt-8 font-display text-lg font-semibold">Servicing allowance (₹ per km)</h3>
      <p className="mt-1 text-sm leading-6 text-muted">Generic allowances by fuel type, not model-specific data. Adjust to match your own experience.</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        {(["petrol", "diesel", "cng", "hybrid", "ev"] as const).map((k) => (
          <NumberAssumption key={k} id={`as-m-${k}`} label={k === "ev" ? "Electric" : k === "cng" ? "CNG" : k[0].toUpperCase() + k.slice(1)} unit="₹/km" value={a.maintenancePerKm[k]} min={0} max={10} step={0.05} edited={overrides.maintenancePerKm?.[k] !== undefined} onCommit={maint(k)} help="Excludes energy." />
        ))}
      </div>
    </section>
  );
}
