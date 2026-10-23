"use client";

import { MapPinIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { neighborhoods, type Neighborhood } from "@/data/issues";

type LocationSelectorProps = {
  value: Neighborhood | "all";
  onValueChange: (value: Neighborhood | "all") => void;
  className?: string;
  iconOnly?: boolean;
};

export function LocationSelector({
  value,
  onValueChange,
  className,
  iconOnly = false,
}: LocationSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as Neighborhood | "all");
      }}
    >
      <SelectTrigger
        className={cn(iconOnly && "size-8 justify-center gap-0 px-0 [&>svg:last-child]:hidden", className)}
        aria-label="Neighborhood"
      >
        <MapPinIcon className="size-4 text-muted-foreground" />
        {iconOnly ? (
          <span className="sr-only">
            {value === "all" ? "All neighborhoods" : value}
          </span>
        ) : (
          <SelectValue>
            {value === "all" ? "All neighborhoods" : value}
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        <SelectItem value="all">All neighborhoods</SelectItem>
        {neighborhoods.map((neighborhood) => (
          <SelectItem key={neighborhood} value={neighborhood}>
            {neighborhood}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
