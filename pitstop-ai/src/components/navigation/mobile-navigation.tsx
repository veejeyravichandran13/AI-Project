"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/store/use-app-store";
import { NAV_ITEMS, isActive } from "./nav-items";

export function MobileNavigation() {
  const pathname = usePathname();
  const compareCount = useAppStore((s) => s.compareIds.length);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden no-print"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon size={24} weight={active ? "fill" : "regular"} />
                  {item.href === "/compare" && compareCount > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                      {compareCount}
                    </span>
                  ) : null}
                </span>
                {item.short}
                {active ? <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
