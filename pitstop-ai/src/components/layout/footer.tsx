import Link from "next/link";
import { Logo } from "./logo";
import { DemoControls } from "./demo-controls";
import { TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface/60 no-print">
      <div className="mx-auto max-w-[88rem] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{TAGLINE}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <nav aria-label="Explore" className="flex flex-col gap-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Explore</p>
              <Link href="/cars" className="py-1.5 hover:text-accent">All cars</Link>
              <Link href="/brands" className="py-1.5 hover:text-accent">Manufacturers</Link>
              <Link href="/discover" className="py-1.5 hover:text-accent">Find my car</Link>
            </nav>
            <nav aria-label="Tools" className="flex flex-col gap-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Tools</p>
              <Link href="/compare" className="py-1.5 hover:text-accent">Compare cars</Link>
              <Link href="/ownership" className="py-1.5 hover:text-accent">Ownership cost lab</Link>
              <Link href="/credits" className="py-1.5 hover:text-accent">Sources and photo credits</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-line bg-surface p-5 text-sm leading-6 text-muted">
          <p className="font-medium text-ink">Where the data comes from</p>
          <p className="mt-1">
            Specifications, prices and safety ratings are collected from manufacturers’ India websites and other cited sources, each linked on the car’s page with the date it was retrieved. Prices are ex-showroom and change often, so confirm with a dealer before buying. Photos are free-licence images from Wikimedia Commons, credited on each photo. Missing values are shown as unavailable, never estimated. Fuel and electricity prices in the cost tools are editable sample values. Nothing here is financial or purchase advice, and no data leaves your browser.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>© 2026 Pitstop AI. Brand and model names belong to their respective owners.</p>
          <DemoControls />
        </div>
      </div>
    </footer>
  );
}
