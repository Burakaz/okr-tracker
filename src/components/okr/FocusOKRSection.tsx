"use client";

import { Star, Clock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import {
  progressToScore,
  isCheckinOverdue,
  getCheckinDaysRemaining,
} from "@/lib/okr-logic";
import type { OKR, OKRCategory } from "@/types";

interface FocusOKRSectionProps {
  okrs: OKR[];
  onSelect: (okr: OKR) => void;
  onToggleFocus: (okr: OKR) => void;
}

const categoryConfig: Record<OKRCategory, { label: string; colorClass: string }> = {
  performance: { label: "Perf", colorClass: "badge-blue" },
  skill: { label: "Skill", colorClass: "badge-yellow" },
  learning: { label: "Learning", colorClass: "badge-green" },
  career: { label: "Karriere", colorClass: "badge-gray" },
};

export function FocusOKRSection({ okrs, onSelect, onToggleFocus }: FocusOKRSectionProps) {
  if (okrs.length === 0) return null;

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
      {okrs.slice(0, 2).map((okr) => {
        const score = progressToScore(okr.progress);
        const daysRemaining = getCheckinDaysRemaining(okr.next_checkin_at);
        const overdue = isCheckinOverdue(okr.next_checkin_at);

        return (
          <div
            key={okr.id}
            onClick={() => onSelect(okr)}
            className="card card-hover border-l-4 border-l-accent-green p-4 cursor-pointer"
          >
            {/* Title row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-foreground truncate">
                  {okr.title}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFocus(okr);
                }}
                className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors flex-shrink-0"
                title="Fokus entfernen"
                aria-label={`Fokus von "${okr.title}" entfernen`}
              >
                <Star className="h-4 w-4 text-accent-green fill-accent-green" aria-hidden="true" />
              </button>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className={`badge ${categoryConfig[okr.category]?.colorClass || "badge-gray"}`}>
                {categoryConfig[okr.category]?.label}
              </span>
              <span className="text-[11px] text-muted">{okr.quarter}</span>
              <StatusBadge status={okr.status} />
              {overdue && <span className="badge badge-red">Überfällig</span>}
              <ScoreBadge score={score} />
            </div>

            {/* Progress bar */}
            <ProgressBar value={okr.progress} showLabel size="md" className="mb-3" />

            {/* Key Results */}
            {okr.key_results && okr.key_results.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {okr.key_results.map((kr) => (
                  <div key={kr.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted truncate">{kr.title}</p>
                    </div>
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {kr.current_value}/{kr.target_value} {kr.unit || ""}
                    </span>
                    <div className="w-12">
                      <ProgressBar value={kr.progress} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Check-in deadline */}
            {daysRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  overdue ? "text-red-500 font-medium" : "text-muted"
                }`}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                {overdue
                  ? `${Math.abs(daysRemaining)} Tage überfällig`
                  : `In ${daysRemaining} Tagen`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
