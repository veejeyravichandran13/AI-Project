"use client";

import { motion } from "framer-motion";

export function ProgressIndicator({ steps, current }: { steps: string[]; current: number }) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">
          Step {current + 1} of {steps.length}
          <span className="text-muted"> · {steps[current]}</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
