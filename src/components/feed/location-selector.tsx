"use client";

import { MapPinIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { neighborhoods, type Neighborhood } from "@/data/issues";

type LocationSelectorProps = {
  value: Neighborhood | "all";
  onValueChange: (value: Neighborhood | "all") => void;
  className?: string;
};

export function LocationSelector({
  value,
  onValueChange,
  className,
}: LocationSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as Neighborhood | "all");
      }}
    >
      <SelectTrigger className={className}>
        <MapPinIcon className="size-4 text-muted-foreground" />
        <SelectValue>
          {value === "all" ? "All neighborhoods" : value}
        </SelectValue>
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
