import type { OwnershipEstimate } from "@/types/ownership";
import { formatInr, formatPriceCompact } from "@/lib/formatters";


export interface ChartSeries {
  id: string;
  name: string;
  estimate: OwnershipEstimate;
}

const COLOURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];
const DASHES = ["", "7 4", "2 4", "10 3 2 3", "14 5"];

/** Distinct shapes so series stay identifiable without relying on colour. */
function Marker({ shape, x, y, color }: { shape: number; x: number; y: number; color: string }) {
  const s = 5;
  switch (shape % 5) {
    case 0: return <circle cx={x} cy={y} r={s} fill={color} />;
    case 1: return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill={color} />;
    case 2: return <polygon points={`${x},${y - s - 1} ${x + s + 1},${y + s} ${x - s - 1},${y + s}`} fill={color} />;
    case 3: return <polygon points={`${x},${y - s - 1} ${x + s + 1},${y} ${x},${y + s + 1} ${x - s - 1},${y}`} fill={color} />;
    default: return <path d={`M${x - s} ${y - s} L${x + s} ${y + s} M${x + s} ${y - s} L${x - s} ${y + s}`} stroke={color} strokeWidth="2.5" />;
  }
}

/** Stacked bars of purchase, energy and maintenance cost, followed by a full text table. */
export function CostComparisonChart({ series, years }: { series: ChartSeries[]; years: number }) {
  const usable = series.filter((s) => s.estimate.totalCost !== null);
  const max = Math.max(1, ...usable.map((s) => s.estimate.totalCost ?? 0));
  const parts = [
    { key: "acquisition", label: "Purchase", className: "bg-ink" },
    { key: "energy", label: "Energy", className: "bg-accent" },
    { key: "maintenance", label: "Servicing", className: "bg-[repeating-linear-gradient(45deg,var(--muted)_0_5px,var(--surface)_5px_9px)]" },
  ] as const;

  const value = (e: OwnershipEstimate, k: (typeof parts)[number]["key"]) =>
    k === "acquisition" ? (e.acquisition ?? 0) : k === "energy" ? (e.cumulativeEnergy ?? 0) : e.cumulativeMaintenance;

  return (
    <figure>
      <figcaption className="font-display text-lg font-semibold">Estimated total cost over {years} {years === 1 ? "year" : "years"}</figcaption>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-3 w-6 rounded-sm border border-line ${p.className}`} />{p.label}</li>
        ))}
      </ul>
      <div className="mt-4 space-y-4">
        {series.map((s) => (
          <div key={s.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="tabular-nums text-muted">{s.estimate.totalCost === null ? "Not enough information" : formatPriceCompact(s.estimate.totalCost)}</span>
            </div>
            {s.estimate.totalCost === null ? (
              <div className="h-7 rounded-lg border border-dashed border-line" />
            ) : (
              <div role="img" aria-label={`${s.name}: ${parts.map((p) => `${p.label} ${formatInr(value(s.estimate, p.key))}`).join(", ")}`} className="flex h-7 overflow-hidden rounded-lg border border-line" style={{ width: `${((s.estimate.totalCost ?? 0) / max) * 100}%`, minWidth: "3rem" }}>
                {parts.map((p) => {
                  const v = value(s.estimate, p.key);
                  const w = (v / (s.estimate.totalCost ?? 1)) * 100;
                  return <div key={p.key} className={p.className} style={{ width: `${w}%` }} />;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <caption className="sr-only">Cost breakdown by car</caption>
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr><th scope="col" className="py-2 pr-3 font-medium">Car</th>{parts.map((p) => <th key={p.key} scope="col" className="py-2 pr-3 text-right font-medium">{p.label}</th>)}<th scope="col" className="py-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <th scope="row" className="py-2 pr-3 font-medium">{s.name}</th>
                {parts.map((p) => {
                  const missing = (p.key === "energy" && s.estimate.annualEnergy === null) || (p.key === "acquisition" && s.estimate.acquisition === null);
                  return <td key={p.key} className="py-2 pr-3 text-right tabular-nums">{missing ? "Not available" : formatInr(value(s.estimate, p.key))}</td>;
                })}
                <td className="py-2 text-right font-medium tabular-nums">{s.estimate.totalCost === null ? "Not enough information" : formatInr(s.estimate.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** Cumulative cost line chart (purchase + running) by year, with a data table for non-visual access. */
export function CumulativeCostChart({ series, years }: { series: ChartSeries[]; years: number }) {
  const lines = series.filter((s) => s.estimate.trajectory.length > 0);
  if (lines.length === 0) return null;
  const W = 640, H = 300, L = 64, R = 24, T = 20, B = 40;
  const maxY = Math.max(...lines.flatMap((s) => s.estimate.trajectory.map((p) => p.cumulative)));
  const minY = Math.min(...lines.flatMap((s) => s.estimate.trajectory.map((p) => p.cumulative)));
  const lo = Math.floor((minY * 0.9) / 100000) * 100000;
  const hi = Math.ceil((maxY * 1.02) / 100000) * 100000;
  const x = (yr: number) => L + (yr / years) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - T - B);
  const yTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) / 4) * i);
  const yearTicks = Array.from({ length: Math.min(years, 10) + 1 }, (_, i) => Math.round((years / Math.min(years, 10)) * i));

  return (
    <figure>
      <figcaption className="font-display text-lg font-semibold">Cumulative cost by year</figcaption>
      <p className="mt-1 text-sm text-muted">Starts at each car’s purchase price and climbs with running costs. Where lines cross, one car has caught up with another.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Line chart of cumulative cost over ${years} years for ${lines.map((l) => l.name).join(", ")}. The same figures appear in the table below.`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{formatPriceCompact(t).replace(" lakh", "L").replace(" crore", "Cr")}</text>
          </g>
        ))}
        {yearTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 14} textAnchor="middle" fontSize="11" fill="var(--muted)">{t === 0 ? "Buy" : `Yr ${t}`}</text>
        ))}
        {lines.map((s, i) => {
          const pts = s.estimate.trajectory.map((p) => `${x(p.year)},${y(p.cumulative)}`).join(" ");
          const last = s.estimate.trajectory[s.estimate.trajectory.length - 1];
          return (
            <g key={s.id}>
              <polyline points={pts} fill="none" stroke={COLOURS[i % 5]} strokeWidth="2.5" strokeDasharray={DASHES[i % 5]} strokeLinejoin="round" />
              {s.estimate.trajectory.map((p) => (p.year % Math.max(1, Math.ceil(years / 5)) === 0 || p.year === last.year ? <Marker key={p.year} shape={i} x={x(p.year)} y={y(p.cumulative)} color={COLOURS[i % 5]} /> : null))}
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
        {lines.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <svg width="34" height="12" aria-hidden="true"><line x1="0" x2="26" y1="6" y2="6" stroke={COLOURS[i % 5]} strokeWidth="2.5" strokeDasharray={DASHES[i % 5]} /><Marker shape={i} x={28} y={6} color={COLOURS[i % 5]} /></svg>
            {s.name}
          </li>
        ))}
      </ul>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[24rem] text-left text-sm">
          <caption className="sr-only">Cumulative cost per year</caption>
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr><th scope="col" className="py-2 pr-3 font-medium">Year</th>{lines.map((s) => <th key={s.id} scope="col" className="py-2 pr-3 text-right font-medium">{s.name}</th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(years) + 1 }, (_, yr) => (
              <tr key={yr} className="border-t border-line">
                <th scope="row" className="py-1.5 pr-3 font-medium">{yr === 0 ? "At purchase" : `Year ${yr}`}</th>
                {lines.map((s) => <td key={s.id} className="py-1.5 pr-3 text-right tabular-nums">{formatInr(s.estimate.trajectory[yr]?.cumulative ?? 0)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
