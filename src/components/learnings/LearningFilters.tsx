"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Palette,
  Code,
  Megaphone,
  Crown,
  BarChart3,
  MessageSquare,
  Package,
  Lightbulb,
} from "lucide-react";
import type { CourseCategory } from "@/types";

interface LearningFiltersProps {
  filters: {
    category?: string;
    provider?: string;
    status?: string;
    search?: string;
  };
  onFilterChange: (filters: {
    category?: string;
    provider?: string;
    status?: string;
    search?: string;
  }) => void;
  showStatusFilter?: boolean;
  providers: string[];
}

const categories: { value: CourseCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Alle", icon: null },
  { value: "design", label: "Design", icon: <Palette className="h-3 w-3" /> },
  { value: "development", label: "Dev", icon: <Code className="h-3 w-3" /> },
  { value: "marketing", label: "Marketing", icon: <Megaphone className="h-3 w-3" /> },
  { value: "leadership", label: "Leadership", icon: <Crown className="h-3 w-3" /> },
  { value: "data", label: "Daten", icon: <BarChart3 className="h-3 w-3" /> },
  { value: "communication", label: "Komm.", icon: <MessageSquare className="h-3 w-3" /> },
  { value: "product", label: "Produkt", icon: <Package className="h-3 w-3" /> },
  { value: "other", label: "Sonstige", icon: <Lightbulb className="h-3 w-3" /> },
];

const statusOptions = [
  { value: "all", label: "Alle" },
  { value: "in_progress", label: "In Arbeit" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "paused", label: "Pausiert" },
];

export function LearningFilters({
  filters,
  onFilterChange,
  showStatusFilter = false,
  providers,
}: LearningFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({
        ...filters,
        search: searchInput || undefined,
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const activeCategory = filters.category ?? "all";
  const activeStatus = filters.status ?? "all";

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              onFilterChange({
                ...filters,
                category: cat.value === "all" ? undefined : cat.value,
              })
            }
            className={`filter-pill flex items-center gap-1.5 ${
              activeCategory === cat.value ||
              (cat.value === "all" && !filters.category)
                ? "active"
                : ""
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Provider + Search row */}
      <div className="flex items-center gap-3">
        {/* Provider dropdown */}
        {providers.length > 0 && (
          <select
            value={filters.provider ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                provider: e.target.value || undefined,
              })
            }
            className="input"
            style={{ maxWidth: "180px" }}
          >
            <option value="">Alle Anbieter</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {/* Status pills */}
        {showStatusFilter && (
          <div className="flex items-center gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    status: opt.value === "all" ? undefined : opt.value,
                  })
                }
                className={`filter-pill ${
                  activeStatus === opt.value ||
                  (opt.value === "all" && !filters.status)
                    ? "active"
                    : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search input */}
        <div className="relative" style={{ minWidth: "200px" }}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Kurse suchen..."
            className="input pl-8"
          />
        </div>
      </div>
    </div>
  );
}
