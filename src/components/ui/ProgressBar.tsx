"use client";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 bg-cream-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fortschritt: ${Math.round(percentage)}%`}
      >
        <div
          className="h-full bg-accent-green rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-muted whitespace-nowrap" aria-hidden="true">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
