"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { CarProfile, Factory, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useUiStore } from "@/store/use-ui-store";
import { useCatalogue } from "@/lib/queries";
import { parseSmartSearch } from "@/lib/smart-search";
import { filtersToParams } from "@/lib/filters-url";
import { carName, carMinPrice } from "@/lib/catalogue";
import { formatPriceCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils/cn";
import { BrandLogo } from "@/components/brands/brand-logo";
import { CarPhoto } from "@/components/cars/car-photo";

interface Item {
  id: string;
  kind: "smart" | "brand" | "car";
  title: string;
  subtitle?: string;
  href: string;
  logo?: string | null;
  car?: import("@/types/car").Car;
}

/** ⌘K / Ctrl+K palette: jump to any car or brand, or describe what you want in plain words. */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const router = useRouter();
  const { data } = useCatalogue();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUiStore.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const items: Item[] = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const out: Item[] = [];
    if (q.length > 2) {
      const parsed = parseSmartSearch(query, data.brands, data.models.map((m) => m.model));
      if (parsed.understood.length > 0 || parsed.filters.query) {
        out.push({ id: "smart", kind: "smart", title: `Show cars: ${parsed.understood.join(" · ") || parsed.filters.query}`, subtitle: "Understood from your words (runs in your browser)", href: `/cars?${filtersToParams(parsed.filters)}` });
      }
    }
    const brands = data.brands.filter((b) => !q || b.name.toLowerCase().includes(q)).slice(0, q ? 4 : 0);
    out.push(...brands.map<Item>((b) => ({ id: `b-${b.slug}`, kind: "brand", title: b.name, logo: b.logo?.path ?? null, subtitle: `${b.modelCount} models · ${b.country}`, href: `/brands/${b.slug}` })));
    const cars = data.models
      .filter((c) => !q || `${c.brand} ${c.model}`.toLowerCase().includes(q))
      .sort((a, b) => carMinPrice(a) - carMinPrice(b))
      .slice(0, q ? 8 : 6);
    out.push(...cars.map<Item>((c) => ({ id: c.id, kind: "car", title: carName(c), subtitle: `From ${formatPriceCompact(carMinPrice(c))} ex-showroom`, href: `/cars/${c.id}`, car: c })));
    return out;
  }, [data, query]);

  useEffect(() => setActive(0), [query, open]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    setQuery("");
    router.push(item.href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_0.15s_ease-out]" />
        <Dialog.Content
          className="glass fixed left-1/2 top-[8vh] z-[91] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-[fade-in_0.18s_ease-out]"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === "Enter") { e.preventDefault(); go(items[active]); }
          }}
        >
          <Dialog.Title className="sr-only">Search cars and brands</Dialog.Title>
          <Dialog.Description className="sr-only">Type a car name, a brand, or describe what you want, for example seven seater diesel SUV under 20 lakh.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-5">
            <MagnifyingGlass size={20} className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a car, a brand, or describe it: 7-seater diesel SUV under 20 lakh"
              aria-label="Search"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
              className="h-16 w-full bg-transparent text-base outline-none placeholder:text-muted/80"
            />
            <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted sm:block">esc</kbd>
          </div>
          <ul id="palette-list" role="listbox" ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {!data ? <li className="px-4 py-8 text-center text-sm text-muted">Loading catalogue…</li> : null}
            {data && items.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted">Nothing matches “{query}”. Try a brand or model name.</li> : null}
            {data && !query ? <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Popular entry points</li> : null}
            {items.map((item, i) => (
              <li key={item.id} id={`palette-${item.id}`} data-index={i} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors", i === active ? "bg-accent-soft" : "hover:bg-surface-2")}
                >
                  {item.kind === "car" && item.car ? (
                    <CarPhoto car={item.car} className="h-11 w-[4.5rem] shrink-0 rounded-lg" />
                  ) : item.kind === "brand" ? (
                    <BrandLogo name={item.title} logo={item.logo} className="h-11 w-[4.5rem] shrink-0 text-[9px]" pad="px-1.5 py-1" />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">{item.kind === "smart" ? <Sparkle size={20} weight="fill" /> : <Factory size={20} />}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.subtitle ? <span className="block truncate text-xs text-muted">{item.subtitle}</span> : null}
                  </span>
                  {item.kind === "car" ? <CarProfile size={16} className="shrink-0 text-muted" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
