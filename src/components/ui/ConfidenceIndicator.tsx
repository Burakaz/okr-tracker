"use client";

import type { ConfidenceLevel } from "@/types";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const labels: Record<ConfidenceLevel, string> = {
  1: "Sehr niedrig",
  2: "Niedrig",
  3: "Mittel",
  4: "Hoch",
  5: "Sehr hoch",
};

export function ConfidenceIndicator({
  level,
  size = "md",
  showLabel = false,
  className = "",
}: ConfidenceIndicatorProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="img" aria-label={`Zuversicht: ${labels[level]} (${level} von 5)`}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className={`${dotSize} rounded-full transition-colors ${
              dot <= level ? "bg-accent-green" : "bg-cream-300"
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-[11px] text-muted">{labels[level]}</span>
      )}
    </div>
  );
}
