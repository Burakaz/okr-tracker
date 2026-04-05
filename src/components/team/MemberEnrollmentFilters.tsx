"use client";

interface EnrollmentCounts {
  all: number;
  in_progress: number;
  completed: number;
  paused: number;
  dropped: number;
}

interface CategoryCount {
  key: string;
  label: string;
  count: number;
}

interface MemberEnrollmentFiltersProps {
  counts: EnrollmentCounts;
  categories: CategoryCount[];
  statusFilter: string | null;
  categoryFilter: string | null;
  onStatusChange: (status: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

const statusLabels: Record<string, string> = {
  in_progress: "In Arbeit",
  completed: "Fertig",
  paused: "Pausiert",
  dropped: "Abgebrochen",
};

export function MemberEnrollmentFilters({
  counts,
  categories,
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
}: MemberEnrollmentFiltersProps) {
  const statusOptions: Array<{ key: string | null; label: string; count: number }> = [
    { key: null, label: "Alle", count: counts.all },
    { key: "in_progress", label: statusLabels.in_progress, count: counts.in_progress },
    { key: "completed", label: statusLabels.completed, count: counts.completed },
    { key: "paused", label: statusLabels.paused, count: counts.paused },
    { key: "dropped", label: statusLabels.dropped, count: counts.dropped },
  ];

  return (
    <div className="space-y-2">
      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.key ?? "all"}
            onClick={() => onStatusChange(opt.key)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
              statusFilter === opt.key
                ? "bg-foreground text-white"
                : "bg-cream-100 text-muted hover:bg-cream-200"
            }`}
          >
            {opt.label}
            {opt.count > 0 && (
              <span className="ml-1 opacity-70">({opt.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
              categoryFilter === null
                ? "bg-cream-300 text-foreground"
                : "bg-cream-50 text-muted hover:bg-cream-100"
            }`}
          >
            Alle Kategorien
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                categoryFilter === cat.key
                  ? "bg-cream-300 text-foreground"
                  : "bg-cream-50 text-muted hover:bg-cream-100"
              }`}
            >
              {cat.label}
              <span className="ml-1 opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
