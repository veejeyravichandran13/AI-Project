import type { Metadata } from "next";
import { staticCatalogue } from "@/lib/server-data";
import { CarDetailView } from "@/features/detail/car-detail-view";

type Params = Promise<{ carId: string }>;

export function generateStaticParams() {
  return staticCatalogue.models.length ? staticCatalogue.models.map((m) => ({ carId: m.id })) : [{ carId: "placeholder" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { carId } = await params;
  const c = staticCatalogue.models.find((m) => m.id === carId);
  return { title: c ? `${c.brand} ${c.model}: price, engines, safety` : "Car not found", description: c?.summary };
}

export default async function CarPage({ params }: { params: Params }) {
  const { carId } = await params;
  return <CarDetailView carId={carId} />;
}
