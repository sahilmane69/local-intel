"use client";

import {
  DropletsIcon,
  LeafIcon,
  ShieldIcon,
  TreesIcon,
  BusIcon,
  RouteIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  categories,
  categoryLabels,
  type Category,
} from "@/data/issues";

export const categoryIcons: Record<Category, LucideIcon> = {
  roads: RouteIcon,
  utilities: DropletsIcon,
  safety: ShieldIcon,
  environment: LeafIcon,
  transit: BusIcon,
  parks: TreesIcon,
};

type CategoryFiltersProps = {
  value: Category | "all";
  onValueChange: (value: Category | "all") => void;
};

export function CategoryFilters({ value, onValueChange }: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Button
        size="sm"
        variant={value === "all" ? "default" : "outline"}
        onClick={() => onValueChange("all")}
      >
        All
      </Button>
      {categories.map((category) => {
        const Icon = categoryIcons[category];
        const selected = value === category;

        return (
          <Button
            key={category}
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={() => onValueChange(category)}
          >
            <Icon data-icon="inline-start" />
            {categoryLabels[category]}
          </Button>
        );
      })}
    </div>
  );
}
