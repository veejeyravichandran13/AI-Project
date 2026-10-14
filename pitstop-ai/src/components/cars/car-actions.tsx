"use client";

import { BookmarkSimple, Check, Plus } from "@phosphor-icons/react";
import { useAppStore } from "@/store/use-app-store";
import { Button, IconButton } from "@/components/ui/button";
import { toast } from "@/store/use-toast-store";
import { MAX_COMPARE } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

export function CompareToggleButton({ carId, name, size = "md", className, iconOnly }: { carId: string; name: string; size?: "sm" | "md"; className?: string; iconOnly?: boolean }) {
  const inCompare = useAppStore((s) => s.compareIds.includes(carId));
  const add = useAppStore((s) => s.addToCompare);
  const remove = useAppStore((s) => s.removeFromCompare);

  const onClick = () => {
    if (inCompare) {
      remove(carId);
      toast(`${name} removed from comparison`);
    } else {
      const r = add(carId);
      toast(r === "full" ? `You can compare up to ${MAX_COMPARE} cars. Remove one to add ${name}.` : `${name} added to comparison`, r === "full" ? "warning" : "success");
    }
    track({ name: "compare_changed", count: useAppStore.getState().compareIds.length });
  };

  if (iconOnly) {
    return (
      <IconButton label={inCompare ? `Remove ${name} from comparison` : `Add ${name} to comparison`} pressed={inCompare} onClick={onClick} className={cn("size-10 bg-black/45 text-white backdrop-blur hover:bg-black/60", inCompare && "bg-accent text-accent-ink hover:bg-accent")}>
        {inCompare ? <Check size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
      </IconButton>
    );
  }
  return (
    <Button variant={inCompare ? "primary" : "secondary"} size={size} className={className} aria-pressed={inCompare} onClick={onClick}>
      {inCompare ? <Check size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
      {inCompare ? "In comparison" : "Compare"}
    </Button>
  );
}

export function ShortlistButton({ carId, name, onPhoto }: { carId: string; name: string; onPhoto?: boolean }) {
  const saved = useAppStore((s) => s.shortlistIds.includes(carId));
  const toggle = useAppStore((s) => s.toggleShortlist);
  return (
    <IconButton
      label={saved ? `Remove ${name} from shortlist` : `Save ${name} to shortlist`}
      pressed={saved}
      className={onPhoto ? cn("size-10 bg-black/45 text-white backdrop-blur hover:bg-black/60", saved && "bg-accent text-accent-ink hover:bg-accent") : undefined}
      onClick={() => {
        const now = toggle(carId);
        toast(now ? `${name} saved on this device only` : `${name} removed from your shortlist`, now ? "success" : "neutral");
      }}
    >
      <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} />
    </IconButton>
  );
}
