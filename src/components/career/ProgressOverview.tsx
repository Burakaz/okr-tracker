"use client";

import { Target, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { UserCareerProgress } from "@/types";

interface ProgressOverviewProps {
  progress: UserCareerProgress | null;
  isLoading?: boolean;
}

export function ProgressOverview({ progress, isLoading }: ProgressOverviewProps) {
  // Placeholder values when no progress data or API is WIP
  const qualifyingOkrs = progress?.qualifying_okr_count ?? 2;
  const requiredOkrs = 4;
  const totalRequirements = 8;
  const fulfilledRequirements = progress ? Math.min(progress.qualifying_okr_count + 2, totalRequirements) : 5;
  const progressPercent = Math.round((fulfilledRequirements / totalRequirements) * 100);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-cream-200 rounded w-48" />
          <div className="h-3 bg-cream-200 rounded w-full" />
          <div className="h-3 bg-cream-200 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-[15px] font-semibold text-foreground mb-4">
        Fortschritt zum nachsten Level
      </h2>

      {/* Main progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted">Gesamtfortschritt</span>
          <span className="text-[13px] font-semibold text-foreground">
            {progressPercent}%
          </span>
        </div>
        <ProgressBar value={progressPercent} size="lg" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {/* Requirements fulfilled */}
        <div className="flex items-start gap-3 p-3 bg-cream-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-greenLight flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <p className="text-[12px] text-muted">Anforderungen erfullt</p>
            <p className="text-[15px] font-semibold text-foreground">
              {fulfilledRequirements} von {totalRequirements}
            </p>
          </div>
        </div>

        {/* OKRs with qualifying score */}
        <div className="flex items-start gap-3 p-3 bg-cream-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-greenLight flex items-center justify-center flex-shrink-0">
            <Target className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <p className="text-[12px] text-muted">OKRs mit Score &gt;= 0.7</p>
            <p className="text-[15px] font-semibold text-foreground">
              {qualifyingOkrs} von {requiredOkrs}
            </p>
          </div>
        </div>
      </div>

      {/* OKR qualifying dots */}
      <div className="mt-4 p-3 bg-cream-50 rounded-lg">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          OKR-Qualifikation
        </p>
        <div className="flex items-center gap-2">
          {Array.from({ length: requiredOkrs }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium transition-colors ${
                i < qualifyingOkrs
                  ? "bg-accent-green text-white"
                  : "bg-cream-200 text-muted"
              }`}
            >
              {i < qualifyingOkrs ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-2">
          {qualifyingOkrs} von {requiredOkrs} OKRs mit Score &gt;= 0.7 erreicht
        </p>
      </div>

      {/* Trend indicator */}
      <div className="mt-4 flex items-center gap-2 text-[12px]">
        <TrendingUp className="h-3.5 w-3.5 text-accent-green" />
        <span className="text-muted">
          Guter Fortschritt - weiter so!
        </span>
      </div>
    </div>
  );
}
