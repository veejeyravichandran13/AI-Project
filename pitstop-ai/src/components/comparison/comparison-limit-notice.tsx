import { Info } from "@phosphor-icons/react/dist/ssr";
import { MAX_COMPARE } from "@/lib/constants";

export function ComparisonLimitNotice({ count }: { count: number }) {
  if (count < MAX_COMPARE) return null;
  return (
    <p role="status" className="flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-sm leading-6">
      <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-warn" />
      You have reached the limit of {MAX_COMPARE} cars. Remove or replace one to add another. Side-by-side tables lose their value beyond five.
    </p>
  );
}
