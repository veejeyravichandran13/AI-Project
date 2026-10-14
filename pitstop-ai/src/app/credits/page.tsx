import type { Metadata } from "next";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { staticCatalogue as cat } from "@/lib/server-data";
import { Container, PageHeader } from "@/components/ui/section";
import { formatDate } from "@/lib/formatters";

export const metadata: Metadata = { title: "Sources, photo and logo credits" };

const TYPE: Record<string, string> = { manufacturer: "Manufacturer", brochure: "Official brochure", ncap: "NCAP", wikipedia: "Wikipedia", "third-party": "Third-party" };

export default function CreditsPage() {
  const bySource = cat.models.flatMap((m) => m.sources.map((s) => s.type));
  const counts = Object.entries(bySource.reduce<Record<string, number>>((a, t) => ({ ...a, [t]: (a[t] ?? 0) + 1 }), {}));
  const photos = cat.models.flatMap((m) => m.images.map((i) => ({ car: `${m.brand} ${m.model}`, ...i })));
  const logos = cat.brands.flatMap((b) => (b.logo ? [{ name: b.name, ...b.logo }] : []));
  const noLogo = cat.brands.filter((b) => !b.logo).map((b) => b.name);
  return (
    <Container className="max-w-5xl py-8 sm:py-14">
      <PageHeader eyebrow="Transparency" title="Sources and photo credits" description="Where every fact and photo on Pitstop AI comes from, and how much to trust it." />
      <section className="space-y-4 text-[15px] leading-7 text-muted">
        <h2 className="font-display text-2xl font-semibold text-ink">How the data was collected</h2>
        <p>Each model’s specifications, prices and safety ratings were read from the pages listed on its own “Sources” section, on the retrieval date shown there. We prefer manufacturers’ India websites and brochures, then NCAP bodies, then Wikipedia and other third parties. Where a source did not state a value, we left it blank rather than estimate it, and the page says “Not available”.</p>
        <p>Prices are ex-showroom and change often. Some manufacturers publish prices only through scripts that block automated access; for those models the price comes from a third-party aggregator, and the car’s page says so. Always confirm with a dealer.</p>
        <p>Manufacturer details such as the headquarters country and parent group are general reference facts rather than per-page citations; each brand page links to its Wikipedia article so you can check them.</p>
        <p>Rankings and metrics use only these published figures: NCAP stars, claimed efficiency, power, boot, wheelbase, seats and ground clearance. Fuel prices, electricity tariffs and servicing allowances in the cost tools are editable generic samples, not model data.</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map(([t, n]) => <div key={t} className="rounded-2xl border border-line bg-surface p-4"><dt className="text-xs text-muted">{TYPE[t] ?? t} sources</dt><dd className="tnum font-display text-2xl font-semibold text-ink">{n}</dd></div>)}
        </dl>
      </section>
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Photo credits</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">All photos are free-licence images from Wikimedia Commons, shown with the author’s credit and licence. Where a photo shows another market or generation of the model, the car’s page says so.</p>
        <div className="scroll-region mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Photo credits for every image</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="p-3 font-medium">Car</th><th scope="col" className="p-3 font-medium">Photo</th><th scope="col" className="p-3 font-medium">Author</th><th scope="col" className="p-3 font-medium">Licence</th></tr></thead>
            <tbody>
              {photos.map((p) => (
                <tr key={p.file} className="border-t border-line align-top">
                  <th scope="row" className="p-3 font-medium">{p.car}</th>
                  <td className="p-3"><a href={p.filePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 underline-offset-2 hover:underline">{p.caption}<ArrowSquareOut size={12} className="mt-1 shrink-0 text-muted" /></a></td>
                  <td className="p-3 text-muted">{p.author}</td>
                  <td className="p-3">{p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{p.license}</a> : p.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mt-14 font-display text-2xl font-semibold">Manufacturer logos</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">Logos are the files listed on Wikimedia Commons as public domain or openly licensed. Manufacturer names and logos are trademarks of their owners. They are shown only to identify each maker and do not imply any endorsement.{noLogo.length ? ` No free-licence logo was found for ${noLogo.join(", ")}, so the name is shown instead.` : ""}</p>
        <div className="scroll-region mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Logo credits for every manufacturer</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="p-3 font-medium">Maker</th><th scope="col" className="p-3 font-medium">File</th><th scope="col" className="p-3 font-medium">Licence</th></tr></thead>
            <tbody>
              {logos.map((l) => (
                <tr key={l.name} className="border-t border-line align-top">
                  <th scope="row" className="p-3 font-medium">{l.name}</th>
                  <td className="p-3"><a href={l.filePageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 underline-offset-2 hover:underline">{l.file.replace(/^File:/, "")}<ArrowSquareOut size={12} className="mt-1 shrink-0 text-muted" /></a></td>
                  <td className="p-3">{l.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">Catalogue generated {formatDate(cat.generatedAt)}.</p>
      </section>
    </Container>
  );
}
