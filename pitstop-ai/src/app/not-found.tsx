import { Container } from "@/components/ui/section";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="max-w-2xl py-20">
      <EmptyState title="That page took a wrong turn" message="We could not find what you were looking for." action={<Button href="/">Back to home</Button>} />
    </Container>
  );
}
