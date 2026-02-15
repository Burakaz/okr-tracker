"use client";

import type { OKRStatus } from "@/types";

interface StatusBadgeProps {
  status: OKRStatus;
  className?: string;
}

const statusConfig: Record<OKRStatus, { label: string; colorClass: string }> = {
  on_track: { label: "Im Plan", colorClass: "badge-green" },
  at_risk: { label: "Gefährdet", colorClass: "badge-yellow" },
  off_track: { label: "Kritisch", colorClass: "badge-red" },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`badge ${config.colorClass} ${className}`}>
      {config.label}
    </span>
  );
}
