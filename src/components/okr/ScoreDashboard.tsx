"use client";

import { useMemo } from "react";
import { TrendingUp, Target, Clock, AlertCircle } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MetricCard } from "@/components/ui/MetricCard";
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
      ? "text-[var(--status-success)]"
      : averageScore >= 0.4
        ? "text-[var(--status-warning)]"
        : "text-[var(--status-error)]";

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
      ? "bg-[var(--status-success)]"
      : averageScore >= 0.4
        ? "bg-[var(--status-warning)]"
        : "bg-[var(--status-error)]";

  // Time-vs-score comparison
  const scorePercent = Math.round(averageScore * 100);
  const isOnTrack = scorePercent >= quarterElapsed * 0.7;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* SCORE */}
      <MetricCard icon={<TrendingUp className="h-4 w-4 text-muted" aria-hidden="true" />} label="Score">
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
      </MetricCard>

      {/* AKTIVE OKRS */}
      <MetricCard icon={<Target className="h-4 w-4 text-muted" aria-hidden="true" />} label="Aktive OKRs">
        <p className="text-2xl font-bold text-foreground">
          {activeOKRs.length}{" "}
          <span className="text-base font-normal text-muted">
            / {MAX_OKRS_PER_QUARTER}
          </span>
        </p>
        <p className="text-[11px] text-muted mt-1">
          Maximum pro Quartal
        </p>
      </MetricCard>

      {/* ZEIT VERGANGEN */}
      <MetricCard icon={<Clock className="h-4 w-4 text-muted" aria-hidden="true" />} label="Zeit vergangen">
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
          <p className="text-[11px] text-[var(--status-warning)] mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {overdueCount} Check-in{overdueCount !== 1 ? "s" : ""} überfällig
          </p>
        )}
      </MetricCard>
    </div>
  );
}
