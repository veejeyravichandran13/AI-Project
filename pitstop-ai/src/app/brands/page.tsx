import type { Metadata } from "next";
import Link from "next/link";
import { staticCatalogue as cat } from "@/lib/server-data";
import { BrandLogo } from "@/components/brands/brand-logo";
import { Container, PageHeader } from "@/components/ui/section";
import { BRAND_TIER_LABEL, brandTier, carMinPrice, type BrandTier } from "@/lib/catalogue";
import { formatPriceCompact } from "@/lib/formatters";

export const metadata: Metadata = { title: "Car manufacturers in India" };

export default function BrandsPage() {
  const rows = cat.brands.map((b) => {
    const cars = cat.models.filter((m) => m.brand === b.name);
    const min = Math.min(...cars.map(carMinPrice));
    return { b, cars, min, tier: brandTier(min) };
  });
  const tiers: BrandTier[] = ["mass", "premium", "exotic"];

  return (
    <Container className="max-w-[88rem] py-8 sm:py-14">
      <PageHeader eyebrow="Manufacturers" title="Every maker on sale in India" description={`${rows.length} manufacturers and ${cat.models.length} current models, each linked to the maker’s own India website. Popular Indian-market brands come first.`} />
      <nav aria-label="Jump to a group" className="-mt-4 mb-10 flex flex-wrap gap-2 text-sm">
        {tiers.map((t) => <a key={t} href={`#tier-${t}`} className="rounded-full border border-line px-4 py-2 text-muted hover:border-ink/30 hover:text-ink">{BRAND_TIER_LABEL[t].title}</a>)}
      </nav>
      {tiers.map((t) => {
        const list = rows.filter((r) => r.tier === t).sort((a, b) => b.cars.length - a.cars.length || a.b.name.localeCompare(b.b.name));
        if (list.length === 0) return null;
        return (
          <section key={t} id={`tier-${t}`} className="mb-14 scroll-mt-24" aria-labelledby={`h-${t}`}>
            <h2 id={`h-${t}`} className="font-display text-3xl font-semibold">{BRAND_TIER_LABEL[t].title}</h2>
            <p className="mt-1 text-muted">{BRAND_TIER_LABEL[t].blurb}</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map(({ b, cars, min }) => (
                <li key={b.slug}>
                  <Link href={`/brands/${b.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/50">
                    <BrandLogo name={b.name} logo={b.logo?.path} bare pad="p-8" className="aspect-[16/9] bg-white transition-transform duration-500 [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105" />
                    <span className="flex flex-col gap-0.5 border-t border-line p-4">
                      <span className="font-display text-xl font-semibold leading-tight">{b.name}</span>
                      <span className="text-sm text-muted">{cars.length} {cars.length === 1 ? "model" : "models"} · from {formatPriceCompact(min)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Container>
  );
}
