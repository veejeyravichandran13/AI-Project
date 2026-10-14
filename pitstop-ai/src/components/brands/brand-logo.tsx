import { cn } from "@/lib/utils/cn";

interface Props {
  name: string;
  /** Local path of the official logo (from the catalogue), or null/undefined for the text wordmark. */
  logo?: string | null;
  className?: string;
  /** Padding inside the white tile. */
  pad?: string;
  /** Hide the tile surface (just the logo or wordmark). */
  bare?: boolean;
}

/**
 * Official manufacturer logo on a white tile, so dark and coloured logos read in both themes.
 * A brand with no free-licence logo gets its name as a plain wordmark, never a made-up mark.
 */
export function BrandLogo({ name, logo, className, pad = "p-3", bare }: Props) {
  return (
    <span className={cn("flex items-center justify-center overflow-hidden", bare ? "" : "rounded-xl bg-white shadow-sm ring-1 ring-black/5", pad, className)}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export, local SVG
        <img src={logo} alt={`${name} logo`} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-center font-display font-semibold leading-tight tracking-wide text-neutral-800">{name}</span>
      )}
    </span>
  );
}
