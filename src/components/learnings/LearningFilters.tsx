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
  X,
} from "lucide-react";
import type { CourseCategory } from "@/types";

interface LearningFiltersProps {
  filters: {
    category?: string;
    status?: string;
    search?: string;
  };
  onFilterChange: (filters: {
    category?: string;
    status?: string;
    search?: string;
  }) => void;
  showStatusFilter?: boolean;
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
  { value: "completed", label: "Fertig" },
  { value: "paused", label: "Pausiert" },
];

export function LearningFilters({
  filters,
  onFilterChange,
  showStatusFilter = false,
}: LearningFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [showSearch, setShowSearch] = useState(!!filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when search is toggled open
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const activeCategory = filters.category ?? "all";
  const activeStatus = filters.status ?? "all";

  const hasActiveFilters = !!filters.category || !!filters.status || !!filters.search;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Category pills — scrollable on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              onFilterChange({
                ...filters,
                category: cat.value === "all" ? undefined : cat.value,
              })
            }
            className={`filter-pill flex items-center gap-1 ${
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

      {/* Divider between category and status */}
      {showStatusFilter && (
        <>
          <div className="w-px h-5 bg-cream-300 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search toggle + input */}
      {showSearch ? (
        <div className="relative flex-shrink-0" style={{ width: "200px" }}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Suchen..."
            className="input pl-8 pr-8 py-1.5 text-[12px]"
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchInput("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-cream-200 rounded"
            aria-label="Suche schliessen"
          >
            <X className="h-3 w-3 text-muted" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Suche öffnen"
        >
          <Search className="h-4 w-4 text-muted" />
        </button>
      )}

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchInput("");
            setShowSearch(false);
            onFilterChange({});
          }}
          className="text-[11px] text-muted hover:text-foreground transition-colors flex-shrink-0"
        >
          Zurücksetzen
        </button>
      )}
    </div>
  );
}
