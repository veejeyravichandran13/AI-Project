"use client";

import Link from "next/link";
import { BookmarkSimple, Trash } from "@phosphor-icons/react";
import { Drawer } from "@/components/ui/modal";
import { useAppStore } from "@/store/use-app-store";
import { useCatalogue } from "@/lib/queries";
import { carMaxPrice, carMinPrice, carName } from "@/lib/catalogue";
import { formatPriceRange } from "@/lib/formatters";
import { CarPhoto } from "@/components/cars/car-photo";
import { IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { toast } from "@/store/use-toast-store";

export function ShortlistDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const ids = useAppStore((s) => s.shortlistIds);
  const toggle = useAppStore((s) => s.toggleShortlist);
  const { data } = useCatalogue();
  const items = ids.map((id) => data?.models.find((v) => v.id === id)).filter((v) => v !== undefined);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Your shortlist" description="Saved in this browser only. Nothing is sent anywhere, and it will not sync to other devices.">
      {ids.length === 0 ? (
        <EmptyState icon={<BookmarkSimple size={28} weight="duotone" />} title="Nothing saved yet" message="Tap the bookmark on any car to keep it here for later." />
      ) : (
        <ul className="space-y-3">
          {items.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
              <CarPhoto car={v} className="h-14 w-24 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Link href={`/cars/${v.id}`} onClick={() => onOpenChange(false)} className="block truncate font-medium hover:underline">{carName(v)}</Link>
                <p className="text-sm text-muted">{formatPriceRange(carMinPrice(v), carMaxPrice(v))}</p>
              </div>
              <IconButton label={`Remove ${carName(v)} from shortlist`} onClick={() => { toggle(v.id); toast(`${carName(v)} removed from your shortlist`); }}>
                <Trash size={20} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
