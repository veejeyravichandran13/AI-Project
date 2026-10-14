"use client";

import type { ReactNode } from "react";
import { Tooltip as T } from "radix-ui";

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          sideOffset={6}
          className="z-[60] max-w-64 rounded-xl bg-ink px-3 py-2 text-xs leading-5 text-bg shadow-[var(--shadow-pop)]"
        >
          {content}
          <T.Arrow className="fill-ink" />
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
