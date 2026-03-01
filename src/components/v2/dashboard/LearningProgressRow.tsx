"use client";

import { BookOpen } from "lucide-react";
import { V2ProgressBar } from "../ui/V2ProgressBar";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import type { Enrollment } from "@/types";

interface LearningProgressRowProps {
  enrollment: Enrollment;
}

export function LearningProgressRow({ enrollment }: LearningProgressRowProps) {
  const completedModules = enrollment.module_completions?.length ?? 0;
  const totalModules = enrollment.course?.modules?.length ?? 0;
  const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="v2-row group">
      <BookOpen className="h-[14px] w-[14px] text-[var(--v2-text-3)] flex-shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className="text-[13px] text-[var(--v2-text)] truncate">
          {enrollment.course?.title ?? "Unbekannter Kurs"}
        </span>
        <span className="text-[11px] text-[var(--v2-text-3)] flex-shrink-0 tabular-nums">
          {completedModules}/{totalModules} Module
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-20 hidden sm:block">
          <V2ProgressBar value={progress} height={2} />
        </div>
        <AnimatedNumber
          value={progress}
          suffix="%"
          className="text-[13px] font-medium text-[var(--v2-text-2)] tabular-nums w-10 text-right"
        />
      </div>
    </div>
  );
}
