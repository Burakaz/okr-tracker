"use client";

import {
  Palette, Code, Megaphone, TrendingUp,
  Settings2, Users, DollarSign, MoreHorizontal,
} from "lucide-react";
import type { CourseCategory } from "@/types";

const CATEGORIES: { key: CourseCategory; label: string; icon: typeof Palette }[] = [
  { key: "design", label: "Design", icon: Palette },
  { key: "development", label: "Development", icon: Code },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "operations", label: "Operations", icon: Settings2 },
  { key: "hr", label: "HR", icon: Users },
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "other", label: "Sonstiges", icon: MoreHorizontal },
];

interface CategoryTilesProps {
  selected: CourseCategory | null;
  onSelect: (category: CourseCategory | null) => void;
}

export function CategoryTiles({ selected, onSelect }: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(isActive ? null : key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
              isActive
                ? "bg-foreground text-white shadow-sm"
                : "bg-cream-50 text-muted hover:bg-cream-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
