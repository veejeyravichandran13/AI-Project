"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./button";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** "sheet" is a bottom sheet on phones and a centred dialog on larger screens. */
  variant?: "dialog" | "sheet";
  className?: string;
}

/**
 * Accessible modal built on Radix Dialog: focus is trapped, Escape closes, and focus returns to
 * the trigger on close.
 */
export function Modal({ open, onOpenChange, title, description, children, footer, variant = "dialog", className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex max-h-[88dvh] flex-col overflow-hidden bg-surface data-[state=open]:animate-[fade-in_0.2s_ease-out] shadow-[var(--shadow-pop)] outline-none",
            variant === "sheet"
              ? "inset-x-0 bottom-0 rounded-t-3xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(44rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
              : "left-1/2 top-1/2 w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" className="-mr-2 -mt-1">
                <X size={20} />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
          {footer ? <div className="border-t border-line px-5 py-3 sm:px-6">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Side drawer for secondary content such as the shortlist. */
export function Drawer({ open, onOpenChange, title, description, children }: Omit<ModalProps, "variant" | "footer" | "className">) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(26rem,100vw)] flex-col bg-surface shadow-[var(--shadow-pop)] outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" className="-mr-2 -mt-1">
                <X size={20} />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
