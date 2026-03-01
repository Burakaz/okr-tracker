"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { OKR } from "@/types";

interface CheckinNudgeProps {
  overdueOKRs: OKR[];
}

export function CheckinNudge({ overdueOKRs }: CheckinNudgeProps) {
  if (overdueOKRs.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--v2-radius-md)] border-l-2 border-l-[var(--v2-warning)] bg-[rgba(245,158,11,0.05)]">
      <AlertTriangle className="h-4 w-4 text-[var(--v2-warning)] flex-shrink-0" />
      <span className="text-[13px] text-[var(--v2-text-2)] flex-1 min-w-0">
        <span className="text-[var(--v2-text)] font-medium">{overdueOKRs.length}</span>
        {" "}{overdueOKRs.length === 1 ? "Ziel braucht" : "Ziele brauchen"} ein Update
      </span>
      <Link
        href="/v2/okrs"
        className="flex items-center gap-1 text-[12px] font-medium text-[var(--v2-warning)] hover:text-[var(--v2-text)] transition-colors flex-shrink-0"
      >
        Check-in
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
