"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Scales, X } from "@phosphor-icons/react";
import { useAppStore } from "@/store/use-app-store";
import { useCatalogue } from "@/lib/queries";
import { MAX_COMPARE } from "@/lib/constants";
import { carName } from "@/lib/catalogue";
import { CarPhoto } from "@/components/cars/car-photo";
import { buttonClass } from "@/components/ui/button";

/** Floating tray that follows the user between screens so comparison never loses state. */
export function VehicleComparisonTray() {
  const pathname = usePathname();
  const ids = useAppStore((s) => s.compareIds);
  const remove = useAppStore((s) => s.removeFromCompare);
  const { data } = useCatalogue();
  // The compare, discover and cost-lab screens already show the selected cars themselves.
  const path = pathname.replace(/\/$/, "") || "/";
  const hidden = path === "/compare" || path === "/discover" || path === "/ownership";

  return (
    <AnimatePresence>
      {ids.length > 0 && !hidden ? (
        <motion.aside
          aria-label="Comparison tray"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="glass fixed inset-x-3 bottom-[4.9rem] z-30 mx-auto flex max-w-2xl items-center gap-3 rounded-3xl p-2.5 pl-3 shadow-[var(--shadow-pop)] lg:bottom-5 no-print"
        >
          <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pt-1.5">
            {ids.map((id) => {
              const v = data?.models.find((x) => x.id === id);
              return (
                <li key={id} className="relative shrink-0">
                  {v ? <CarPhoto car={v} className="h-11 w-[4.5rem] rounded-xl" /> : <div className="skeleton h-11 w-[4.5rem] rounded-xl" />}
                  <button type="button" onClick={() => remove(id)} aria-label={`Remove ${v ? carName(v) : "car"} from comparison`} className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-ink text-bg shadow">
                    <X size={12} weight="bold" />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="hidden shrink-0 text-xs text-muted sm:block" aria-live="polite">{ids.length} of {MAX_COMPARE}</p>
          <Link href="/compare" className={buttonClass("primary", "sm", "shrink-0")}>
            <Scales size={16} weight="bold" /> Compare {ids.length}
          </Link>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
