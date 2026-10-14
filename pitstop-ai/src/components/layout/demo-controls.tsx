"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flask } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "@/store/use-toast-store";
import { cn } from "@/lib/utils/cn";

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const failing = useAppStore((s) => s.simulateFailure);
  const setFailing = useAppStore((s) => s.setSimulateFailure);
  const reset = useAppStore((s) => s.resetSession);
  const qc = useQueryClient();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-surface-2 hover:text-ink">
        <Flask size={18} /> Demo controls
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Demo controls"
        description="Prototype-only tools for exercising error states and resetting the session."
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-line p-4">
            <div>
              <p id="sim-fail-label" className="font-medium">Simulate failing requests</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Every mock service call fails while this is on, so you can see error messages and Retry buttons. Turning it off lets screens recover on their own, or you can press Try again.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={failing}
              aria-labelledby="sim-fail-label"
              onClick={() => {
                const next = !failing;
                setFailing(next);
                // Re-run active queries so the change is visible immediately.
                setTimeout(() => void qc.invalidateQueries(), 0);
                toast(next ? "Mock requests will now fail" : "Mock requests will succeed again — use Try again on any error");
              }}
              className="relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line bg-surface-2 transition-colors aria-checked:border-accent aria-checked:bg-accent"
            >
              <span aria-hidden="true" className={cn("ml-0.5 inline-block size-5 rounded-full transition-transform", failing ? "translate-x-5 bg-accent-ink" : "bg-ink")} />
            </button>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="font-medium">Reset this browser session</p>
            <p className="mt-1 text-sm leading-6 text-muted">Clears your answers, shortlist, comparison and cost assumptions saved in this browser.</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => {
                reset();
                qc.clear();
                setOpen(false);
                toast("Session reset", "success");
              }}
            >
              Reset session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
