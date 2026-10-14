import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { CompareView } from "@/features/comparison/compare-view";

export const metadata: Metadata = { title: "Compare cars" };

export default function ComparePage() {
  return (
    <Container className="max-w-[88rem] py-8 sm:py-14">
      <CompareView />
    </Container>
  );
}
