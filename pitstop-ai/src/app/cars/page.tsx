import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageHeader } from "@/components/ui/section";
import { ExploreView } from "@/features/explore/explore-view";
import { Skeleton } from "@/components/feedback/loading-skeleton";

export const metadata: Metadata = { title: "Explore every new car in India" };

export default function CarsPage() {
  return (
    <Container className="max-w-[88rem] py-8 sm:py-12">
      <PageHeader eyebrow="Explore" title="Every new car, sourced" description="Real models with published prices, engines, safety ratings and photo credits. Filter by what matters, or describe what you want in plain words." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ExploreView />
      </Suspense>
    </Container>
  );
}
