"use client";

import {
  BookmarkIcon,
  LayoutGridIcon,
  MapIcon,
  PlusIcon,
  RadarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AppView } from "./types";

type MobileNavProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onReport: () => void;
};

const items: { id: AppView; label: string; icon: typeof LayoutGridIcon }[] = [
  { id: "feed", label: "Feed", icon: LayoutGridIcon },
  { id: "nearby", label: "Nearby", icon: RadarIcon },
  { id: "map", label: "Areas", icon: MapIcon },
  { id: "saved", label: "Saved", icon: BookmarkIcon },
];

export function MobileNav({ view, onViewChange, onReport }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 py-2 backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center">
        {items.slice(0, 2).map((item) => (
          <NavButton
            key={item.id}
            {...item}
            active={view === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
        <div className="flex justify-center">
          <Button
            size="icon"
            className="rounded-full"
            aria-label="Report an Issue"
            onClick={onReport}
          >
            <PlusIcon />
          </Button>
        </div>
        {items.slice(2).map((item) => (
          <NavButton
            key={item.id}
            {...item}
            active={view === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: AppView;
  label: string;
  icon: typeof LayoutGridIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className={`h-auto flex-col gap-1 py-1.5 text-[11px] ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
