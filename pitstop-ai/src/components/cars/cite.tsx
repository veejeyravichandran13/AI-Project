import type { Car } from "@/types/car";

/** Footnote-style citation: a small numbered link to the source list on the same page. */
export function Cite({ car, id }: { car: Car; id: string | undefined }) {
  if (!id) return null;
  const i = car.sources.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const s = car.sources[i];
  return (
    <sup className="ml-0.5">
      <a
        href={`#source-${s.id}`}
        title={`${s.label} (${s.type})`}
        aria-label={`Source ${i + 1}: ${s.label}`}
        className="rounded px-0.5 text-[10px] font-semibold text-accent no-underline hover:bg-accent-soft"
      >
        [{i + 1}]
      </a>
    </sup>
  );
}
