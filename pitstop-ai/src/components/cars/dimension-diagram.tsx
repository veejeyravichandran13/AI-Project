import type { Car } from "@/types/car";
import { formatNumber } from "@/lib/formatters";

/**
 * A neutral schematic, not the real body shape. It only exists to place the published
 * measurements (length, height, wheelbase, ground clearance) where a reader expects them.
 */
export function DimensionDiagram({ car }: { car: Car }) {
  const d = car.dimensions;
  const len = d.lengthMm?.v;
  const h = d.heightMm?.v;
  const wb = d.wheelbaseMm?.v;
  const gc = d.groundClearanceMm?.v;
  if (!len && !h && !wb && !gc) return null;
  const L = 520, x0 = 60, ground = 150;
  const bodyH = h ? Math.min(100, Math.max(60, (h / (len ?? 4300)) * 380)) : 80;
  const wbPx = wb && len ? (wb / len) * L : L * 0.6;
  const wx1 = x0 + (L - wbPx) / 2;
  const wx2 = wx1 + wbPx;
  const m = (v: number | undefined) => (v ? `${formatNumber(v, 0)} mm` : "n/a");
  return (
    <figure>
      <svg viewBox="0 0 640 230" className="w-full" role="img" aria-label={`Schematic with published dimensions: length ${m(len)}, height ${m(h)}, wheelbase ${m(wb)}, ground clearance ${m(gc)}`}>
        <line x1={x0 - 10} x2={x0 + L + 10} y1={ground + 24} y2={ground + 24} stroke="var(--line)" strokeWidth="2" />
        <path d={`M${x0} ${ground - 12} L${x0 + 20} ${ground - bodyH * 0.55} Q${x0 + 70} ${ground - bodyH} ${x0 + 160} ${ground - bodyH} L${x0 + L - 130} ${ground - bodyH} Q${x0 + L - 40} ${ground - bodyH * 0.9} ${x0 + L - 14} ${ground - bodyH * 0.45} L${x0 + L} ${ground - 12} L${x0 + L} ${ground + 6} L${x0} ${ground + 6} Z`} fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        {[wx1, wx2].map((x) => <g key={x}><circle cx={x} cy={ground + 6} r="22" fill="var(--bg)" stroke="var(--muted)" strokeWidth="1.5" /><circle cx={x} cy={ground + 6} r="9" fill="var(--line)" /></g>)}
        {/* length */}
        <g stroke="var(--accent)" strokeWidth="1.2" fill="var(--accent)" fontSize="12"><line x1={x0} x2={x0 + L} y1="205" y2="205" /><line x1={x0} x2={x0} y1="199" y2="211" /><line x1={x0 + L} x2={x0 + L} y1="199" y2="211" /><text x={x0 + L / 2} y="224" textAnchor="middle" stroke="none">Length {m(len)}</text></g>
        {/* wheelbase */}
        <text x={(wx1 + wx2) / 2} y={ground - 14 - bodyH * 0.3} textAnchor="middle" fontSize="12" fill="var(--c2)">Wheelbase {m(wb)}</text>
        {/* height */}
        <g stroke="var(--c3)" strokeWidth="1.2" fill="var(--c3)" fontSize="12"><line x1={x0 + L + 28} x2={x0 + L + 28} y1={ground + 24} y2={ground - bodyH} /><line x1={x0 + L + 22} x2={x0 + L + 34} y1={ground - bodyH} y2={ground - bodyH} /><text x={x0 + L + 36} y={ground - bodyH / 2 + 10} stroke="none">Height</text><text x={x0 + L + 36} y={ground - bodyH / 2 + 25} stroke="none">{m(h)}</text></g>
        {/* ground clearance */}
        <g stroke="var(--c5)" strokeWidth="1.2" fill="var(--c5)" fontSize="12"><line x1={x0 - 22} x2={x0 - 22} y1={ground + 24} y2={ground + 6} /><text x={x0 - 28} y={ground - 2} textAnchor="end" stroke="none">Clearance</text><text x={x0 - 28} y={ground + 13} textAnchor="end" stroke="none">{m(gc)}</text></g>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-muted">Schematic, not to scale or the real body shape. Values are the published measurements.</figcaption>
    </figure>
  );
}
