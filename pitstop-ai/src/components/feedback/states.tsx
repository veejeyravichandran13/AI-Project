"use client";

import type { ReactNode } from "react";
import { ArrowClockwise, Compass, WarningOctagon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function RetryAction({ onRetry, busy }: { onRetry: () => void; busy?: boolean }) {
  return (
    <Button variant="secondary" onClick={onRetry} disabled={busy}>
      <ArrowClockwise size={18} className={busy ? "animate-spin" : undefined} />
      {busy ? "Retrying…" : "Try again"}
    </Button>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  busy,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  busy?: boolean;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("rounded-3xl border border-bad/30 bg-bad-soft p-8 text-center", className)}>
      <WarningOctagon size={36} weight="duotone" className="mx-auto text-bad" />
      <h2 className="mt-3 font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {message ?? "We could not load this. Nothing you entered has been lost."}
      </p>
      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <RetryAction onRetry={onRetry} busy={busy} />
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
  className,
}: {
  title: string;
  message: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-dashed border-line bg-surface/60 p-8 text-center sm:p-12", className)}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon ?? <Compass size={28} weight="duotone" />}
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
      <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</div>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
