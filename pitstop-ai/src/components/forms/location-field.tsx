"use client";

import { STATES } from "@/data/locations";
import { SelectField } from "./select-field";

interface Props {
  stateCode: string;
  city: string;
  onChange: (next: { stateCode: string; city: string }) => void;
  stateError?: string;
  cityError?: string;
}

export function LocationField({ stateCode, city, onChange, stateError, cityError }: Props) {
  const cities = STATES.find((s) => s.code === stateCode)?.cities ?? [];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField
        id="state"
        label="State or region"
        optional
        value={stateCode}
        error={stateError}
        onChange={(code) => onChange({ stateCode: code, city: "" })}
        options={[{ value: "", label: "Skip — use India-wide estimates" }, ...STATES.map((s) => ({ value: s.code, label: s.name }))]}
        hint="Used for fuel, electricity and on-road price assumptions."
      />
      <SelectField
        id="city"
        label="City"
        optional
        value={city}
        error={cityError}
        disabled={!stateCode}
        onChange={(c) => onChange({ stateCode, city: c })}
        options={[{ value: "", label: stateCode ? "Any city in this state" : "Choose a state first" }, ...cities.map((c) => ({ value: c, label: c }))]}
      />
    </div>
  );
}
