import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import type { Requirements } from "@/types/recommendation";
import { summariseRequirements } from "@/lib/formatters/labels";

export function RequirementsSummary({ requirements, onEdit }: { requirements: Requirements; onEdit?: (step: number) => void }) {
  const items = summariseRequirements(requirements);
  return (
    <dl className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
      {items.map((i) => (
        <div key={i.id} className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <dt className="text-sm text-muted">{i.title}</dt>
            <dd className="mt-0.5 font-medium">{i.value}</dd>
            {i.note ? <p className="mt-1 text-sm leading-6 text-muted">{i.note}</p> : null}
          </div>
          {onEdit ? (
            <button type="button" onClick={() => onEdit(i.step)} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-accent hover:bg-accent-soft" aria-label={`Edit ${i.title.toLowerCase()}`}>
              <PencilSimple size={16} /> Edit
            </button>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
