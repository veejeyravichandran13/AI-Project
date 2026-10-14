import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { RecommendationsView } from "@/features/recommendations/recommendations-view";

export const metadata: Metadata = { title: "Your top five matches" };

export default function RecommendationsPage() {
  return (
    <Container className="max-w-[88rem] py-8 sm:py-14">
      <RecommendationsView />
    </Container>
  );
}
