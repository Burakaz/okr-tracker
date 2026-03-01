"use client";

import { useMemo } from "react";
import { TrendingUp, Target, Clock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  progressToScore,
  getQuarterDateRange,
  MAX_OKRS_PER_QUARTER,
} from "@/lib/okr-logic";
import type { OKR } from "@/types";

interface ScoreDashboardProps {
  okrs: OKR[];
  quarter: string;
}

export function ScoreDashboard({ okrs, quarter }: ScoreDashboardProps) {
  const activeOKRs = useMemo(
    () => okrs.filter((o) => o.is_active),
    [okrs]
  );

  const averageScore = useMemo(() => {
    if (activeOKRs.length === 0) return 0;
    const totalProgress = activeOKRs.reduce((sum, o) => sum + o.progress, 0);
    return progressToScore(totalProgress / activeOKRs.length);
  }, [activeOKRs]);

  const quarterElapsed = useMemo(() => {
    const { start, end } = getQuarterDateRange(quarter);
    const now = Date.now();
    const total = end.getTime() - start.getTime();
    const elapsed = now - start.getTime();

    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;
    return Math.round((elapsed / total) * 100);
  }, [quarter]);

  const scoreColor =
    averageScore >= 0.7
      ? "text-green-600"
      : averageScore >= 0.4
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* SCORE */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-cream-100 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Score
          </span>
        </div>
        <p className={`text-xl font-bold ${scoreColor}`}>
          {averageScore.toFixed(2)}
        </p>
        <p className="text-[11px] text-muted mt-0.5">
          Durchschnitt aller aktiven OKRs
        </p>
      </div>

      {/* AKTIVE OKRS */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-cream-100 flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Aktive OKRs
          </span>
        </div>
        <p className="text-xl font-bold text-foreground">
          {activeOKRs.length}{" "}
          <span className="text-sm font-normal text-muted">
            / {MAX_OKRS_PER_QUARTER}
          </span>
        </p>
        <p className="text-[11px] text-muted mt-0.5">
          Maximum pro Quartal
        </p>
      </div>

      {/* ZEIT VERGANGEN */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-cream-100 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Zeit vergangen
          </span>
        </div>
        <p className="text-xl font-bold text-foreground">{quarterElapsed}%</p>
        <ProgressBar value={quarterElapsed} size="sm" className="mt-1.5" />
      </div>
    </div>
  );
}
