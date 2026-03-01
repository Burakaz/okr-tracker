"use client";

import { AnimatedNumber } from "../motion/AnimatedNumber";
import { V2ProgressBar } from "../ui/V2ProgressBar";

interface QuarterHeroProps {
  quarter: string;
  daysRemaining: number;
  avgProgress: number;
}

export function QuarterHero({ quarter, daysRemaining, avgProgress }: QuarterHeroProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h1
          className="text-[22px] font-semibold text-[var(--v2-text)]"
          style={{ letterSpacing: "var(--v2-tracking-h)" }}
        >
          {quarter}
        </h1>
        <AnimatedNumber
          value={avgProgress}
          suffix="%"
          className="text-[22px] font-semibold text-[var(--v2-accent)] tabular-nums"
        />
      </div>
      <p className="text-[13px] text-[var(--v2-text-3)]">
        {daysRemaining > 0
          ? `${daysRemaining} Tage verbleibend`
          : "Quartal beendet"}
      </p>
      <V2ProgressBar value={avgProgress} height={2} />
    </div>
  );
}
