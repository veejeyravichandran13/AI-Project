import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/section";
import { DiscoveryFlow } from "@/features/discovery/discovery-flow";

export const metadata: Metadata = { title: "Find my car" };

export default function DiscoverPage() {
  return (
    <Container className="max-w-6xl py-8 sm:py-14">
      <PageHeader eyebrow="Guided discovery" title="Let’s find your shortlist" />
      <DiscoveryFlow />
    </Container>
  );
}
