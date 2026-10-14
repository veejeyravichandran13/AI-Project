"use client";

import { useState } from "react";
import { DesktopNavigation } from "@/components/navigation/desktop-navigation";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { VehicleComparisonTray } from "@/components/comparison/vehicle-comparison-tray";
import { ShortlistDrawer } from "./shortlist-drawer";
import { CommandPalette } from "./command-palette";
import { Footer } from "./footer";
import { Toaster } from "@/components/ui/toaster";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [shortlistOpen, setShortlistOpen] = useState(false);
  return (
    <>
      <a href="#main" className="sr-only z-[95] rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <DesktopNavigation onOpenShortlist={() => setShortlistOpen(true)} />
      <main id="main" className="pb-28 lg:pb-8">{children}</main>
      <Footer />
      <MobileNavigation />
      <VehicleComparisonTray />
      <ShortlistDrawer open={shortlistOpen} onOpenChange={setShortlistOpen} />
      <CommandPalette />
      <Toaster />
    </>
  );
}
