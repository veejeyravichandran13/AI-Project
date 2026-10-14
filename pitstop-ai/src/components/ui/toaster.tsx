"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { useToastStore } from "@/store/use-toast-store";

const icons = {
  neutral: <Info size={18} weight="fill" />,
  success: <CheckCircle size={18} weight="fill" className="text-good" />,
  warning: <WarningCircle size={18} weight="fill" className="text-warn" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 no-print"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-[var(--shadow-pop)]"
          >
            {icons[t.tone]}
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="-mr-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-bg/15">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
