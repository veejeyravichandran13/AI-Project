"use client";

import { Container } from "@/components/ui/section";
import { ErrorState } from "@/components/feedback/states";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="max-w-2xl py-20">
      <ErrorState title="Something went wrong on this page" message={error.message || "An unexpected error occurred. Your saved answers are still in this browser."} onRetry={reset} />
    </Container>
  );
}
