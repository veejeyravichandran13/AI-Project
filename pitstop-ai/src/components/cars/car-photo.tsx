import type { Car } from "@/types/car";
import { cn } from "@/lib/utils/cn";
import { carName, leadImage } from "@/lib/catalogue";
import { BrandLogo } from "@/components/brands/brand-logo";

interface Props {
  car: Car;
  index?: number;
  /** "thumb" uses the 720px WebP; "full" the 1280px original. */
  size?: "thumb" | "full";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Show a one-line credit over the photo. */
  credit?: boolean;
  alt?: string;
}

/**
 * Real photographs from Wikimedia Commons with attribution. If a model has no suitable free-licence
 * photo we show a neutral placeholder that says so, never a stand-in photo of a different car.
 */
export function CarPhoto({ car, index = 0, size = "thumb", className, imgClassName, priority, credit, alt }: Props) {
  const img = car.images[index] ?? (index === 0 ? leadImage(car) : null);
  if (!img) {
    return (
      <div className={cn("@container relative flex items-center justify-center overflow-hidden bg-surface-2", className)}>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_100%,var(--glow),transparent)]" />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 p-[8%]">
          <BrandLogo name={car.brand} logo={car.brandLogo} className="h-3/5 min-h-0 w-4/5 max-w-60 text-[10px] @[12rem]:text-base" pad="px-[6%] py-[3%]" />
          <p className="hidden text-center text-[11px] leading-4 text-muted @[14rem]:block">No free-licence photo of this model yet</p>
        </div>
      </div>
    );
  }
  const note =
    img.match === "exact" ? null : img.match === "same-model-other-market" ? "Photo shows another market" : "Photo shows another generation";
  return (
    <figure className={cn("relative overflow-hidden bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export with locally generated thumbnails */}
      <img
        src={size === "full" ? img.localPath : img.thumbPath}
        alt={alt ?? `${carName(car)}: ${img.caption}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
      {credit ? (
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-[11px] leading-4 text-white/85">
          <span>
            Photo:{" "}
            <a href={img.filePageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              {img.author.length > 42 ? `${img.author.slice(0, 40)}…` : img.author}
            </a>
            , {img.licenseUrl ? <a href={img.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{img.license}</a> : img.license}
          </span>
          {note ? <span className="rounded-full bg-white/20 px-2 py-px">{note}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
