import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p> : null}
        <Tag className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</Tag>
        {description ? <p className="mt-3 text-base leading-7 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-8 sm:mb-10">
      {breadcrumb ? <div className="mb-4 text-sm text-muted">{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p> : null}
          <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">{title}</h1>
          {description ? <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 no-print">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={cn("rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]", className)}>{children}</Tag>;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
