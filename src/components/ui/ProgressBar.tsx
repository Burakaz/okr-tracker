"use client";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  color?: "green" | "amber" | "red";
  marker?: number; // 0-100, optional target marker position
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  green: "bg-accent-green",
  amber: "bg-[var(--status-warning)]",
  red: "bg-[var(--status-error)]",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  color = "green",
  marker,
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative flex-1 bg-cream-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fortschritt: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
        {marker !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cream-400/80"
            style={{ left: `${Math.min(Math.max(marker, 0), 100)}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-muted whitespace-nowrap" aria-hidden="true">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
