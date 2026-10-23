"use client";

import {
  BookmarkIcon,
  CompassIcon,
  LayoutGridIcon,
  MapIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  RadarIcon,
  UserRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function AppSidebar({
  view,
  onViewChange,
  location,
  onLocationChange,
  openCount,
  savedCount,
  collapsed = false,
  onCollapsedChange,
}: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2 py-4",
          collapsed ? "flex-col px-2" : "px-3"
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-2", collapsed && "justify-center")}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <CompassIcon className="size-4" />
          </div>
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                Local Intel
              </p>
              <p className="truncate text-xs text-muted-foreground">Fairview</p>
            </div>
          )}
        </div>
        {onCollapsedChange ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(collapsed ? undefined : "ml-auto")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
          </Button>
        ) : null}
      </div>

      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <LocationSelector
          value={location}
          onValueChange={onLocationChange}
          className={collapsed ? "w-8 justify-center px-0" : "w-full"}
          iconOnly={collapsed}
        />
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          const button = (
            <Button
              type="button"
              variant={active ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn("w-full", !collapsed && "justify-start")}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              onClick={() => onViewChange(item.id)}
            >
              <Icon data-icon="inline-start" />
              {collapsed ? null : item.label}
              {!collapsed && item.id === "saved" && savedCount > 0 ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  {savedCount}
                </span>
              ) : null}
            </Button>
          );

          if (!collapsed) {
            return <div key={item.id}>{button}</div>;
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger render={button} />
              <TooltipContent side="right">
                {item.label}
                {item.id === "saved" && savedCount > 0 ? ` (${savedCount})` : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator />
      <div className={cn("grid gap-2 p-2", collapsed && "justify-items-center")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex size-8 items-center justify-center rounded-md text-sm font-semibold">
                  {openCount}
                </div>
              }
            />
            <TooltipContent side="right">{openCount} open issues</TooltipContent>
          </Tooltip>
        ) : (
          <div className="px-2 py-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Open in view
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{openCount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
