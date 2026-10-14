"use client";

import type { ReactNode } from "react";
import { Popover } from "radix-ui";
import { CaretDown, Check } from "@phosphor-icons/react";
import type { Option } from "@/data/discovery-options";
import { cn } from "@/lib/utils/cn";
import { FieldShell, controlClass, describedBy } from "./field-shell";

interface MultiSelectFieldProps<T extends string> {
  id: string;
  label: string;
  values: T[];
  onChange: (values: T[]) => void;
  options: Option<T>[];
  max?: number;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
}

export function MultiSelectField<T extends string>({
  id,
  label,
  values,
  onChange,
  options,
  max,
  hint,
  error,
  placeholder = "Select one or more",
}: MultiSelectFieldProps<T>) {
  const atLimit = max !== undefined && values.length >= max;
  const summary = values.length
    ? options.filter((o) => values.includes(o.value)).map((o) => o.label).join(", ")
    : placeholder;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Popover.Root>
        <Popover.Trigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(controlClass, "flex items-center justify-between gap-3 text-left", !values.length && "text-muted")}
        >
          <span className="truncate">{summary}</span>
          <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
            {max ? `${values.length}/${max}` : null}
            <CaretDown size={18} />
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className="z-50 w-[var(--radix-popover-trigger-width)] rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-pop)]"
          >
            <fieldset>
              <legend className="sr-only">{label}</legend>
              {options.map((o) => {
                const checked = values.includes(o.value);
                const disabled = !checked && atLimit;
                return (
                  <label
                    key={o.value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] hover:bg-surface-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                      disabled && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onChange(checked ? values.filter((v) => v !== o.value) : [...values, o.value])}
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-md border border-line bg-surface text-accent-ink peer-checked:border-accent peer-checked:bg-accent"
                    >
                      {checked ? <Check size={14} weight="bold" /> : null}
                    </span>
                    {o.label}
                  </label>
                );
              })}
            </fieldset>
            {atLimit ? <p className="px-3 pb-1 pt-2 text-xs text-muted">Limit reached. Untick one to pick another.</p> : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </FieldShell>
  );
}
