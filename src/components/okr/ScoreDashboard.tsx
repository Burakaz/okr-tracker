"use client";

import { useMemo } from "react";
import { TrendingUp, Target, Clock, AlertCircle } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  progressToScore,
  getQuarterDateRange,
  isCheckinOverdue,
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

  const overdueCount = useMemo(
    () => activeOKRs.filter((o) => isCheckinOverdue(o.next_checkin_at)).length,
    [activeOKRs]
  );

  const scoreColor =
    averageScore >= 0.7
      ? "text-green-600"
      : averageScore >= 0.4
        ? "text-amber-600"
        : "text-red-600";

  const scoreLabel =
    averageScore >= 0.7
      ? "Erfolgreich"
      : averageScore >= 0.4
        ? "Fortschritt"
        : "Aufholbedarf";

  const scoreBadgeClass =
    averageScore >= 0.7
      ? "badge-green"
      : averageScore >= 0.4
        ? "badge-yellow"
        : "badge-red";

  const scoreBarColor =
    averageScore >= 0.7
      ? "bg-green-500"
      : averageScore >= 0.4
        ? "bg-amber-500"
        : "bg-red-400";

  // Time-vs-score comparison
  const scorePercent = Math.round(averageScore * 100);
  const isOnTrack = scorePercent >= quarterElapsed * 0.7;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* SCORE */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Score
          </span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <p className={`text-2xl font-bold ${scoreColor}`}>
            {averageScore.toFixed(2)}
          </p>
          <span className={`badge ${scoreBadgeClass}`}>{scoreLabel}</span>
        </div>
        {/* Score scale */}
        <div className="relative mt-1">
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBarColor}`}
              style={{ width: `${Math.min(averageScore * 100, 100)}%` }}
            />
          </div>
          {/* 0.7 marker line */}
          <div
            className="absolute top-0 h-2 w-px bg-foreground/40"
            style={{ left: "70%" }}
          />
          <div className="flex justify-between items-start mt-1.5 relative">
            <span className="text-[10px] text-muted">0.0</span>
            <span
              className="text-[10px] text-muted absolute"
              style={{ left: "70%", transform: "translateX(-50%)" }}
            >
              0.7 = Erfolg
            </span>
            <span className="text-[10px] text-muted">1.0</span>
          </div>
        </div>
      </div>

      {/* AKTIVE OKRS */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
            <Target className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Aktive OKRs
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {activeOKRs.length}{" "}
          <span className="text-base font-normal text-muted">
            / {MAX_OKRS_PER_QUARTER}
          </span>
        </p>
        <p className="text-[11px] text-muted mt-1">
          Maximum pro Quartal
        </p>
      </div>

      {/* ZEIT VERGANGEN */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Zeit vergangen
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">{quarterElapsed}%</p>
        <ProgressBar value={quarterElapsed} size="sm" className="mt-2" />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[11px] text-muted">
            Score: {scorePercent}%
          </span>
          <span className={`badge ${isOnTrack ? "badge-green" : "badge-yellow"}`}>
            {isOnTrack ? "Im Zeitplan" : "Hinter Zeitplan"}
          </span>
        </div>
        {overdueCount > 0 && (
          <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {overdueCount} Check-in{overdueCount !== 1 ? "s" : ""} überfällig
          </p>
        )}
      </div>
    </div>
  );
}
