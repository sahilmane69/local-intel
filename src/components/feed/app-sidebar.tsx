"use client";

import {
  BookmarkIcon,
  CompassIcon,
  LayoutGridIcon,
  MapIcon,
  RadarIcon,
  UserRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Neighborhood } from "@/data/issues";

import { LocationSelector } from "./location-selector";
import type { AppView } from "./types";

const navItems: { id: AppView; label: string; icon: typeof LayoutGridIcon }[] = [
  { id: "feed", label: "Community feed", icon: LayoutGridIcon },
  { id: "nearby", label: "Nearby", icon: RadarIcon },
  { id: "map", label: "Neighborhoods", icon: MapIcon },
  { id: "saved", label: "Saved", icon: BookmarkIcon },
  { id: "profile", label: "Profile", icon: UserRoundIcon },
];

type AppSidebarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  location: Neighborhood | "all";
  onLocationChange: (value: Neighborhood | "all") => void;
  openCount: number;
  savedCount: number;
};

export function AppSidebar({
  view,
  onViewChange,
  location,
  onLocationChange,
  openCount,
  savedCount,
}: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
          <CompassIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Local Intel</p>
          <p className="text-xs text-muted-foreground">Fairview community</p>
        </div>
      </div>

      <div className="px-3">
        <LocationSelector
          value={location}
          onValueChange={onLocationChange}
          className="w-full"
        />
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;

          return (
            <Button
              key={item.id}
              variant={active ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onViewChange(item.id)}
            >
              <Icon data-icon="inline-start" />
              {item.label}
              {item.id === "saved" && savedCount > 0 ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  {savedCount}
                </span>
              ) : null}
            </Button>
          );
        })}
      </nav>

      <Separator />
      <div className="px-4 py-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Snapshot
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{openCount}</p>
        <p className="text-sm text-muted-foreground">open issues in view</p>
      </div>
    </div>
  );
}
