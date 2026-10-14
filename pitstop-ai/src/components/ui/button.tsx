import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,box-shadow,border-color] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink shadow-sm hover:brightness-110 hover:shadow-md",
  secondary: "border border-line bg-surface text-ink hover:border-ink/30 hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-sm",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = { variant?: Variant; size?: Size; children?: ReactNode; className?: string };
type ButtonProps = CommonProps & Omit<ComponentProps<"button">, "children" | "className"> & { href?: undefined };
type LinkProps = CommonProps & Omit<ComponentProps<typeof Link>, "children" | "className">;

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const cls = buttonClass(variant, size, className);
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as Omit<LinkProps, keyof CommonProps>)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as Omit<ButtonProps, keyof CommonProps>)}>
      {children}
    </button>
  );
}

export const PrimaryButton = (p: ButtonProps | LinkProps) => <Button {...p} variant="primary" />;
export const SecondaryButton = (p: ButtonProps | LinkProps) => <Button {...p} variant="secondary" />;

export function IconButton({
  label,
  className,
  children,
  pressed,
  ...rest
}: Omit<ComponentProps<"button">, "aria-label"> & { label: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-150 hover:bg-surface-2 active:scale-90 disabled:pointer-events-none disabled:opacity-40",
        pressed && "bg-accent-soft text-accent",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
