"use client";

import { AnimatedNumber } from "../motion/AnimatedNumber";

interface InlineStatsProps {
  activeCount: number;
  avgProgress: number;
  activeCourses: number;
  daysRemaining: number;
}

export function InlineStats({
  activeCount,
  avgProgress,
  activeCourses,
  daysRemaining,
}: InlineStatsProps) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[var(--v2-text-2)] flex-wrap">
      <span className="flex items-center gap-1">
        <AnimatedNumber value={activeCount} className="text-[var(--v2-text)] font-medium tabular-nums" />
        <span>Aktiv</span>
      </span>
      <span className="text-[var(--v2-text-3)]">&middot;</span>
      <span className="flex items-center gap-1">
        <AnimatedNumber value={avgProgress} suffix="%" className="text-[var(--v2-text)] font-medium tabular-nums" />
        <span>&Oslash;</span>
      </span>
      <span className="text-[var(--v2-text-3)]">&middot;</span>
      <span className="flex items-center gap-1">
        <AnimatedNumber value={activeCourses} className="text-[var(--v2-text)] font-medium tabular-nums" />
        <span>{activeCourses === 1 ? "Kurs" : "Kurse"}</span>
      </span>
      <span className="text-[var(--v2-text-3)]">&middot;</span>
      <span className="flex items-center gap-1">
        <AnimatedNumber value={daysRemaining} className="text-[var(--v2-text)] font-medium tabular-nums" />
        <span>Tage</span>
      </span>
    </div>
  );
}
