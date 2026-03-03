"use client";

import { Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCategoryLabel, getCategoryClassName, progressToScore } from "@/lib/okr-logic";
import type { OKR } from "@/types";

interface MemberOKRSectionProps {
  okrs: OKR[];
}

export function MemberOKRSection({ okrs }: MemberOKRSectionProps) {
  if (okrs.length === 0) {
    return (
      <div className="text-center py-4">
        <Target className="h-5 w-5 text-muted mx-auto mb-1" />
        <p className="text-[12px] text-muted">Keine aktiven OKRs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5" />
        OKRs ({okrs.length})
      </h4>

      {okrs.map((okr) => {
        const score = progressToScore(okr.progress);
        return (
          <div key={okr.id} className="rounded-lg border border-cream-300/50 bg-cream-50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`badge text-[10px] ${getCategoryClassName(okr.category)}`}>
                {getCategoryLabel(okr.category)}
              </span>
              <p className="text-[13px] font-medium text-foreground flex-1 truncate">
                {okr.title}
              </p>
              <span className="text-[12px] font-semibold text-foreground tabular-nums">
                {score.toFixed(1)}
              </span>
            </div>

            <ProgressBar value={okr.progress} size="sm" />

            {/* Key Results */}
            {okr.key_results && okr.key_results.length > 0 && (
              <div className="mt-2 space-y-1">
                {okr.key_results.map((kr) => (
                  <div key={kr.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted truncate flex-1 mr-2">{kr.title}</span>
                    <span className="text-foreground/70 tabular-nums flex-shrink-0">
                      {kr.current_value}/{kr.target_value}
                      {kr.unit ? ` ${kr.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
