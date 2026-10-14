"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
import { useAppStore } from "@/store/use-app-store";
import { configureMockApi } from "@/lib/mock-api";

function StoreBridge() {
  const simulateFailure = useAppStore((s) => s.simulateFailure);

  // Persisted state is restored after mount so server and first client render match.
  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    configureMockApi({ failing: simulateFailure });
  }, [simulateFailure]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Failures should surface as a visible error with a Retry button, not silent retries.
          queries: { retry: false, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 34 }}>
        <QueryClientProvider client={client}>
          <Tooltip.Provider delayDuration={250}>
            <StoreBridge />
            {children}
          </Tooltip.Provider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
