"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IconButton } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { NAV_ITEMS, isActive } from "./nav-items";

export function DesktopNavigation({ onOpenShortlist }: { onOpenShortlist: () => void }) {
  const pathname = usePathname();
  const compareCount = useAppStore((s) => s.compareIds.length);
  const shortlistCount = useAppStore((s) => s.shortlistIds.length);
  const openPalette = useUiStore((s) => s.setPaletteOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/70 backdrop-blur-xl no-print">
      <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors", active ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink")}
              >
                {item.label}
                {item.href === "/compare" && compareCount > 0 ? (
                  <span className={cn("inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold", active ? "bg-bg text-ink" : "bg-accent text-accent-ink")}>{compareCount}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openPalette(true)}
            className="hidden min-h-10 items-center gap-2 rounded-full border border-line bg-surface/70 px-4 text-sm text-muted transition-colors hover:border-ink/30 hover:text-ink md:inline-flex"
            aria-label="Search cars and brands"
          >
            <MagnifyingGlass size={16} />
            Search any car
            <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
          </button>
          <IconButton label="Search cars and brands" className="md:hidden" onClick={() => openPalette(true)}>
            <MagnifyingGlass size={22} />
          </IconButton>
          <span className="relative">
            <IconButton label={`Saved shortlist (${shortlistCount})`} onClick={onOpenShortlist}>
              <BookmarkSimple size={22} weight={shortlistCount ? "fill" : "regular"} />
            </IconButton>
            {shortlistCount > 0 ? (
              <span aria-hidden="true" className="pointer-events-none absolute right-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-ink">{shortlistCount}</span>
            ) : null}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
