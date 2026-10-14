import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { staticCatalogue as cat } from "@/lib/server-data";
import { CarCard } from "@/components/cars/car-card";
import { BrandLogo } from "@/components/brands/brand-logo";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { carMaxPrice, carMinPrice } from "@/lib/catalogue";
import { formatPriceRange } from "@/lib/formatters";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return cat.brands.length ? cat.brands.map((b) => ({ slug: b.slug })) : [{ slug: "placeholder" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const b = cat.brands.find((x) => x.slug === slug);
  return { title: b ? `${b.name} cars in India` : "Manufacturer not found" };
}

export default async function BrandPage({ params }: { params: Params }) {
  const { slug } = await params;
  const brand = cat.brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  const cars = cat.models.filter((m) => m.brand === brand.name).sort((a, b) => carMinPrice(a) - carMinPrice(b));
  const min = Math.min(...cars.map(carMinPrice));
  const max = Math.max(...cars.map(carMaxPrice));
  const evs = cars.filter((c) => c.options.some((o) => o.fuel === "ev")).length;
  const five = cars.filter((c) => c.safety.ncap?.stars === 5).length;

  const facts = [
    { label: "Models on sale", value: String(cars.length) },
    { label: "Price range", value: formatPriceRange(min, max) },
    { label: "Electric models", value: String(evs) },
    { label: "5-star NCAP models", value: String(five) },
  ];

  return (
    <>
      <header className="relative isolate overflow-hidden bg-black text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_85%_20%,var(--glow),transparent),linear-gradient(to_bottom,#0b0d12,#000)]" />
        <Container className="max-w-[88rem] pb-12 pt-24 sm:pt-32">
          <BrandLogo name={brand.name} logo={brand.logo?.path} className="mb-6 h-24 w-56 sm:h-28 sm:w-72" pad="px-6 py-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Manufacturer</p>
          <h1 className="font-display text-5xl font-semibold leading-none sm:text-8xl">{brand.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Group headquarters: {brand.country}
            {brand.parent ? ` · part of ${brand.parent}` : ""}
            {brand.founded ? ` · founded ${brand.founded.v}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={brand.indiaWebsite} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>{brand.name} India website <ArrowSquareOut size={16} /></a>
            {brand.wikipediaUrl ? <a href={brand.wikipediaUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md", "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white")}>Wikipedia <ArrowSquareOut size={16} /></a> : null}
          </div>
          {brand.logo ? (
            <p className="mt-6 text-[11px] text-white/50">
              Logo: <a href={brand.logo.filePageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{brand.logo.file.replace(/^File:/, "")}</a> via Wikimedia Commons, {brand.logo.license}. {brand.name} and its logo are trademarks of their owners and are shown only to identify the maker.
            </p>
          ) : (
            <p className="mt-6 text-[11px] text-white/50">No free-licence logo is available for {brand.name}, so its name is shown instead.</p>
          )}
        </Container>
      </header>
      <Container className="max-w-[88rem] py-12 sm:py-16">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl border border-line bg-surface p-5"><dt className="text-xs text-muted">{f.label}</dt><dd className="tnum mt-1 font-display text-2xl font-semibold">{f.value}</dd></div>
          ))}
        </dl>
        <h2 className="mt-14 font-display text-3xl font-semibold sm:text-4xl">{brand.name} models</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cars.map((c, i) => <li key={c.id}><CarCard car={c} index={i} className="h-full" /></li>)}
        </ul>
      </Container>
    </>
  );
}
