"use client";

import { V2ProgressBar } from "../ui/V2ProgressBar";
import { V2Badge } from "../ui/V2Badge";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import { getCategoryLabel } from "@/lib/okr-logic";
import type { OKR } from "@/types";

interface FocusOKRRowProps {
  okr: OKR;
}

const CATEGORY_VARIANTS: Record<string, "default" | "accent" | "warning" | "info"> = {
  performance: "accent",
  skill: "info",
  learning: "warning",
  career: "default",
};

export function FocusOKRRow({ okr }: FocusOKRRowProps) {
  return (
    <div className="v2-row group">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="text-[13px] text-[var(--v2-text)] font-medium truncate">
          {okr.title}
        </span>
        <V2Badge variant={CATEGORY_VARIANTS[okr.category] || "default"} className="flex-shrink-0">
          {getCategoryLabel(okr.category)}
        </V2Badge>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-24 hidden sm:block">
          <V2ProgressBar value={okr.progress} height={2} />
        </div>
        <AnimatedNumber
          value={okr.progress}
          suffix="%"
          className="text-[13px] font-medium text-[var(--v2-text-2)] tabular-nums w-10 text-right"
        />
      </div>
    </div>
  );
}
