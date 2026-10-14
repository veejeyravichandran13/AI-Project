import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Associates label, helper text and error with a control for assistive technology. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[15px] font-medium">
        {label}
        {optional ? <span className="text-xs font-normal text-muted">Optional</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm leading-6 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, hint?: ReactNode, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export const controlClass =
  "w-full min-h-12 rounded-2xl border border-line bg-surface px-4 text-base text-ink transition-colors hover:border-ink/30 focus-visible:border-accent aria-[invalid=true]:border-bad disabled:opacity-50";
