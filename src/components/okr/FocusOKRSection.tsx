"use client";

import { Star } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { OKR, OKRCategory } from "@/types";

interface FocusOKRSectionProps {
  okrs: OKR[];
  onSelect: (okr: OKR) => void;
  onToggleFocus: (okr: OKR) => void;
}

const categoryConfig: Record<OKRCategory, { label: string; colorClass: string }> = {
  performance: { label: "Performance", colorClass: "badge-blue" },
  skill: { label: "Skill", colorClass: "badge-yellow" },
  learning: { label: "Learning", colorClass: "badge-green" },
  career: { label: "Karriere", colorClass: "badge-gray" },
};

export function FocusOKRSection({ okrs, onSelect, onToggleFocus }: FocusOKRSectionProps) {
  if (okrs.length === 0) return null;

  return (
    <div className="px-6 pt-4">
      <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 text-accent-green fill-accent-green" />
        Fokus OKRs
      </h2>
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {okrs.slice(0, 2).map((okr) => (
          <div
            key={okr.id}
            onClick={() => onSelect(okr)}
            className="card card-hover border-l-4 border-l-accent-green p-4 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-foreground truncate">
                  {okr.title}
                </h3>
                <span className={`badge ${categoryConfig[okr.category]?.colorClass || "badge-gray"} mt-1`}>
                  {categoryConfig[okr.category]?.label}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFocus(okr);
                }}
                className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors flex-shrink-0"
                title="Fokus entfernen"
              >
                <Star className="h-4 w-4 text-accent-green fill-accent-green" />
              </button>
            </div>

            <ProgressBar value={okr.progress} showLabel size="md" className="mb-3" />

            {/* Inline Key Results */}
            {okr.key_results && okr.key_results.length > 0 && (
              <div className="space-y-1.5">
                {okr.key_results.slice(0, 3).map((kr) => (
                  <div key={kr.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] text-muted truncate">{kr.title}</p>
                    </div>
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {kr.current_value}/{kr.target_value}
                    </span>
                    <div className="w-12">
                      <ProgressBar value={kr.progress} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
