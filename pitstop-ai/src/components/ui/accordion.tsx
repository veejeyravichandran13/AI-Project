"use client";

import type { ReactNode } from "react";
import { Accordion as A } from "radix-ui";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

export interface AccordionEntry {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({
  items,
  defaultOpen = [],
  className,
}: {
  items: AccordionEntry[];
  defaultOpen?: string[];
  className?: string;
}) {
  return (
    <A.Root type="multiple" defaultValue={defaultOpen} className={cn("divide-y divide-line rounded-2xl border border-line bg-surface", className)}>
      {items.map((item) => (
        <A.Item key={item.id} value={item.id}>
          <A.Header>
            <A.Trigger className="group flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-medium">
              {item.title}
              <CaretDown size={16} className="shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden px-4 pb-4 text-sm leading-6 data-[state=closed]:hidden">{item.content}</A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
