"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brands/brand-logo";
import { ArrowLeft, ArrowRight, ArrowsLeftRight, Star, X } from "@phosphor-icons/react";
import type { ComparisonData } from "@/lib/mock-api";
import type { Cell } from "@/lib/calculations/comparison";
import type { Requirements } from "@/types/recommendation";
import { COMPARISON_ROWS, ROW_GROUPS, bestIndexes, personalMeaning } from "@/lib/calculations/comparison";
import { BODY_LABEL, FUEL_LABEL, carName, getOption } from "@/lib/catalogue";
import { useAppStore } from "@/store/use-app-store";
import { CarPhoto } from "@/components/cars/car-photo";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/store/use-toast-store";

interface Props {
  data: ComparisonData;
  requirements: Requirements | null;
  showMeaning: boolean;
  differencesOnly: boolean;
  onReplace: (carId: string) => void;
}

function CellView({ cell, best, meaning }: { cell: Cell; best: boolean; meaning: string | null }) {
  return (
    <div className={cn("space-y-1", best && "font-medium")}>
      {cell.kind === "value" ? (
        <p className="text-[15px] leading-6">
          {cell.text}
          {cell.cite ? <sup className="ml-0.5"><Link href={`/cars/${cell.cite.carId}#source-${cell.cite.sourceId}`} aria-label="View this value's source" className="rounded px-0.5 text-[10px] font-semibold text-accent no-underline hover:bg-accent-soft">src</Link></sup> : null}
        </p>
      ) : (
        <p className="text-[15px] italic text-muted">{cell.text}</p>
      )}
      {best ? <p className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-xs font-semibold text-good"><Star size={12} weight="fill" /> Best in row<span className="sr-only"> among these cars</span></p> : null}
      {cell.hint ? <p className="text-xs leading-5 text-muted">{cell.hint}</p> : null}
      {meaning ? <p className="text-xs italic leading-5 text-accent">For you: {meaning}</p> : null}
    </div>
  );
}

export function ComparisonTable({ data, requirements, showMeaning, differencesOnly, onReplace }: Props) {
  const move = useAppStore((s) => s.moveInCompare);
  const remove = useAppStore((s) => s.removeFromCompare);
  const setOption = useAppStore((s) => s.setOption);
  const { items } = data;

  const groups = ROW_GROUPS.map((g) => ({
    group: g,
    rows: COMPARISON_ROWS.filter((r) => r.group === g).filter((r) => (!differencesOnly || items.length < 2 ? true : new Set(items.map((i) => r.cell(i).text)).size > 1)),
  })).filter((g) => g.rows.length > 0);

  const labelCell = "sticky left-0 z-10 w-32 min-w-32 max-w-32 border-r border-line bg-surface p-3 text-left align-top text-sm font-medium sm:w-48 sm:min-w-48 sm:max-w-48";

  return (
    <div className="scroll-region overflow-x-auto rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]" tabIndex={0} role="region" aria-label="Side-by-side comparison. Scroll horizontally for more cars.">
      <table className="w-full border-collapse" style={{ minWidth: `${12 + items.length * 14}rem` }}>
        <caption className="sr-only">Comparison of {items.map((i) => carName(i.car)).join(", ")}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(labelCell, "font-display text-base")}>Compare</th>
            {items.map((item, idx) => {
              const name = carName(item.car);
              const o = getOption(item.car, item.optionId);
              return (
                <th key={item.car.id} scope="col" className="min-w-[14rem] border-l border-line p-3 text-left align-top font-normal">
                  <CarPhoto car={item.car} className="aspect-[16/10] w-full rounded-xl" />
                  <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"><BrandLogo name={item.car.brand} logo={item.car.brandLogo} className="h-6 w-11 shrink-0 text-[7px]" pad="px-1 py-0.5" />{item.car.brand}</p>
                  <Link href={`/cars/${item.car.id}`} className="block font-display text-xl font-semibold leading-tight hover:underline">{item.car.model}</Link>
                  <p className="text-xs text-muted">{BODY_LABEL[item.car.bodyType]} · {FUEL_LABEL[o.fuel]}</p>
                  <label className="mt-2 block text-xs text-muted" htmlFor={`opt-${item.car.id}`}>Engine option</label>
                  <select id={`opt-${item.car.id}`} value={o.id} onChange={(e) => setOption(item.car.id, e.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-line bg-surface px-2 text-sm">
                    {item.car.options.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                  <div className="-ml-2 mt-2 flex items-center no-print">
                    <IconButton label={`Move ${name} left`} disabled={idx === 0} onClick={() => move(item.car.id, -1)} className="size-10"><ArrowLeft size={18} /></IconButton>
                    <IconButton label={`Move ${name} right`} disabled={idx === items.length - 1} onClick={() => move(item.car.id, 1)} className="size-10"><ArrowRight size={18} /></IconButton>
                    <IconButton label={`Replace ${name}`} onClick={() => onReplace(item.car.id)} className="size-10"><ArrowsLeftRight size={18} /></IconButton>
                    <IconButton label={`Remove ${name}`} onClick={() => { remove(item.car.id); toast(`${name} removed from comparison`); }} className="size-10"><X size={18} /></IconButton>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-accent-soft/50"><th scope="colgroup" colSpan={items.length + 1} className="sticky left-0 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-accent">For your brief</th></tr>
          {data.hasRequirements && requirements ? (
            <>
              <tr className="border-t border-line">
                <th scope="row" className={labelCell}>Fit for you</th>
                {items.map((i) => (
                  <td key={i.car.id} className="border-l border-line p-3 align-top text-[15px]">
                    {i.fit ? i.fit.eligible ? <p className="font-medium">{i.fit.fit === "strong" ? "Strong fit" : i.fit.fit === "good" ? "Good fit" : "Reasonable fit"}</p> : <div><p className="font-medium text-bad">Outside your brief</p><ul className="mt-1 list-disc pl-4 text-xs leading-5 text-muted">{i.fit.violations.map((v) => <li key={v}>{v}</li>)}</ul></div> : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <th scope="row" className={labelCell}>Why it may fit</th>
                {items.map((i) => <td key={i.car.id} className="border-l border-line p-3 align-top"><ul className="list-disc space-y-1 pl-4 text-sm leading-5">{i.fit?.reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul></td>)}
              </tr>
              <tr className="border-t border-line">
                <th scope="row" className={labelCell}>Trade-offs for you</th>
                {items.map((i) => <td key={i.car.id} className="border-l border-line p-3 align-top"><ul className="list-disc space-y-1 pl-4 text-sm leading-5">{i.fit?.drawbacks.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul></td>)}
              </tr>
            </>
          ) : (
            <tr className="border-t border-line">
              <th scope="row" className={labelCell}>Personal notes</th>
              <td colSpan={items.length} className="border-l border-line p-3 text-sm text-muted">Personalised fit and trade-offs appear once you share your brief. <Link href="/discover" className="font-medium text-accent underline underline-offset-2">Find My Car</Link>. Until then, cost figures use sample defaults.</td>
            </tr>
          )}
          {groups.map(({ group, rows }) => (
            <GroupRows key={group} group={group} rows={rows} items={items} requirements={requirements} showMeaning={showMeaning} labelCell={labelCell} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ group, rows, items, requirements, showMeaning, labelCell }: { group: string; rows: typeof COMPARISON_ROWS; items: ComparisonData["items"]; requirements: Requirements | null; showMeaning: boolean; labelCell: string }) {
  return (
    <>
      <tr className="bg-surface-2"><th scope="colgroup" colSpan={items.length + 1} className="sticky left-0 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted">{group}</th></tr>
      {rows.map((row) => {
        const best = bestIndexes(row, items);
        return (
          <tr key={row.id} className="border-t border-line">
            <th scope="row" className={labelCell}>{row.label}</th>
            {items.map((item, idx) => (
              <td key={item.car.id} className={cn("border-l border-line p-3 align-top", best.has(idx) && "bg-good-soft/40")}>
                <CellView cell={row.cell(item)} best={best.has(idx)} meaning={showMeaning ? personalMeaning(row.id, item, requirements) : null} />
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
