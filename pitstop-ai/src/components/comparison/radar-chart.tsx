import type { Metrics } from "@/lib/catalogue/metrics";

export interface RadarSeries {
  id: string;
  name: string;
  metrics: Metrics;
}

const AXES: { key: keyof Metrics; label: string }[] = [
  { key: "safety", label: "Crash safety" },
  { key: "efficiency", label: "Running cost" },
  { key: "performance", label: "Power" },
  { key: "space", label: "Space" },
  { key: "groundClearance", label: "Clearance" },
];
const COLOURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];
const DASHES = ["", "7 4", "2 4", "10 3 2 3", "14 5"];

/** Radar over percentile metrics derived from published figures. Unknown axes plot at the centre and are flagged in the table. */
export function RadarChart({ series }: { series: RadarSeries[] }) {
  const W = 520, H = 360, CX = W / 2, CY = H / 2 + 6, R = 120;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    return [CX + Math.cos(a) * R * (v / 10), CY + Math.sin(a) * R * (v / 10)] as const;
  };
  const rings = [2.5, 5, 7.5, 10];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-xl" role="img" aria-label={`Radar chart comparing ${series.map((s) => s.name).join(", ")} on crash safety, running cost, power, space and clearance. The same values are in the table below.`}>
        {rings.map((r) => <polygon key={r} points={AXES.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="var(--line)" />)}
        {AXES.map((a, i) => {
          const [x, y] = pt(i, 10);
          const [lx, ly] = pt(i, 11.8);
          return (
            <g key={a.key}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--line)" />
              <text x={lx} y={ly} textAnchor={lx < CX - 4 ? "end" : lx > CX + 4 ? "start" : "middle"} dominantBaseline="middle" fontSize="11" fill="var(--muted)">{a.label}</text>
            </g>
          );
        })}
        {series.map((s, k) => {
          const pts = AXES.map((a, i) => pt(i, (s.metrics[a.key] as number | null) ?? 0));
          return (
            <g key={s.id}>
              <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={COLOURS[k % 5]} fillOpacity="0.1" stroke={COLOURS[k % 5]} strokeWidth="2.2" strokeDasharray={DASHES[k % 5]} strokeLinejoin="round" />
              {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" fill={COLOURS[k % 5]} />)}
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm" aria-label="Legend">
        {series.map((s, k) => (
          <li key={s.id} className="flex items-center gap-2"><svg width="30" height="10" aria-hidden="true"><line x1="0" x2="30" y1="5" y2="5" stroke={COLOURS[k % 5]} strokeWidth="2.5" strokeDasharray={DASHES[k % 5]} /></svg>{s.name}</li>
        ))}
      </ul>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[26rem] text-left text-sm">
          <caption className="sr-only">Metric values behind the radar chart</caption>
          <thead className="text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="py-2 pr-3 font-medium">Metric</th>{series.map((s) => <th key={s.id} scope="col" className="py-2 pr-3 text-right font-medium">{s.name}</th>)}</tr></thead>
          <tbody>
            {AXES.map((a) => (
              <tr key={a.key} className="border-t border-line">
                <th scope="row" className="py-1.5 pr-3 font-medium">{a.label}</th>
                {series.map((s) => { const v = s.metrics[a.key] as number | null; return <td key={s.id} className="tnum py-1.5 pr-3 text-right">{v === null ? <span className="text-muted">not published</span> : v.toFixed(1)}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">Percentile among all catalogue cars (10 = best): NCAP stars, claimed efficiency at sample fuel prices, power, boot/wheelbase/seats, and ground clearance.</p>
      </div>
    </figure>
  );
}
