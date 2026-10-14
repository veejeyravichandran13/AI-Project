"use client";

import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { Option } from "@/data/discovery-options";
import { cn } from "@/lib/utils/cn";
import { FieldShell, controlClass, describedBy } from "./field-shell";

interface SelectFieldProps<T extends string | number> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown built on the native <select>: fully keyboard accessible, works with screen readers,
 * and gets the platform picker on phones.
 */
export function SelectField<T extends string | number>({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
  optional,
  placeholder,
  disabled,
  className,
}: SelectFieldProps<T>) {
  const selected = options.find((o) => o.value === value);
  return (
    <FieldShell id={id} label={label} hint={hint ?? selected?.hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          id={id}
          value={String(value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint ?? selected?.hint, error)}
          onChange={(e) => {
            const next = options.find((o) => String(o.value) === e.target.value);
            if (next) onChange(next.value);
          }}
          className={cn(controlClass, "appearance-none pr-11")}
        >
          {placeholder ? (
            <option value="" disabled={value !== ("" as T)}>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}
