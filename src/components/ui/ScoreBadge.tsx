"use client";

interface ScoreBadgeProps {
  score: number; // 0.0 - 1.0
  className?: string;
}

export function ScoreBadge({ score, className = "" }: ScoreBadgeProps) {
  const displayScore = Math.min(Math.max(score, 0), 1).toFixed(1);

  let colorClass = "badge-red";
  if (score >= 0.7) {
    colorClass = "badge-green";
  } else if (score >= 0.4) {
    colorClass = "badge-yellow";
  }

  return (
    <span className={`badge ${colorClass} ${className}`}>
      {displayScore}
    </span>
  );
}
