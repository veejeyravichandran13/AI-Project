import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { CostLabView } from "@/features/ownership/cost-lab-view";

export const metadata: Metadata = { title: "Ownership cost lab" };

export default function OwnershipPage() {
  return (
    <Container className="max-w-[88rem] py-8 sm:py-14">
      <CostLabView />
    </Container>
  );
}
