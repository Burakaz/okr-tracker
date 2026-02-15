"use client";

import { Award, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CareerLevel, UserCareerProgress } from "@/types";

interface CareerProgressCardProps {
  currentLevel: CareerLevel | null;
  nextLevel: CareerLevel | null;
  progress: UserCareerProgress | null;
  className?: string;
}

export function CareerProgressCard({
  currentLevel,
  nextLevel,
  progress,
  className = "",
}: CareerProgressCardProps) {
  const qualifyingCount = progress?.qualifying_okr_count || 0;
  const requiredCount = nextLevel?.min_okrs_with_target_score || 4;
  const progressPercent = Math.min((qualifyingCount / requiredCount) * 100, 100);

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-accent-greenLight flex items-center justify-center">
          <Award className="h-4 w-4 text-accent-green" />
        </div>
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wider">Karrierestufe</p>
          <p className="text-[14px] font-semibold text-foreground">
            {currentLevel?.name || "Nicht festgelegt"}
          </p>
        </div>
      </div>

      {/* Progress to next level */}
      {nextLevel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">Fortschritt zum nächsten Level</span>
            <span className="text-[12px] font-medium text-foreground">
              {qualifyingCount}/{requiredCount}
            </span>
          </div>
          <ProgressBar value={progressPercent} size="md" />

          {/* Qualifying OKR dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from({ length: requiredCount }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-medium ${
                  i < qualifyingCount
                    ? "bg-accent-green text-white"
                    : "bg-cream-200 text-muted"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 mt-2 text-[12px] text-muted">
            <span>Nächstes Level:</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{nextLevel.name}</span>
          </div>
        </div>
      )}

      {!nextLevel && currentLevel && (
        <p className="text-[12px] text-accent-green font-medium">
          Höchste Stufe erreicht
        </p>
      )}
    </div>
  );
}
