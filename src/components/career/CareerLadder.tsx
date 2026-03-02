"use client";

import { useState } from "react";
import {
  ChevronDown,
  Check,
  Clock,
  CheckCircle2,
  Circle,
  Minus,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CareerPathLevel } from "@/lib/career-paths";

interface CareerLadderProps {
  levels: CareerPathLevel[];
  currentLevelId?: string | null;
  pathName?: string;
}

export function CareerLadder({
  levels,
  currentLevelId,
  pathName,
}: CareerLadderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentIndex = currentLevelId
    ? levels.findIndex((l) => l.id === currentLevelId)
    : 0;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-1.5">
      {levels.map((level, index) => {
        const isCurrentLevel = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isNextLevel = index === currentIndex + 1;
        const isFuture = index > currentIndex;
        const isExpanded = expandedId === level.id;

        // Progress placeholder
        const levelProgress = isCompleted ? 100 : isCurrentLevel ? 71 : 0;

        // Requirements fulfilled placeholder
        const reqCount = level.requirements.length;
        const reqFulfilled = isCompleted
          ? reqCount
          : isCurrentLevel
            ? Math.floor(reqCount * 0.6)
            : 0;

        return (
          <div key={level.id}>
            {/* Level Row */}
            <button
              onClick={() => toggleExpand(level.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                isCurrentLevel
                  ? "bg-accent-greenLight/40 border border-accent-green/20"
                  : isExpanded
                    ? "bg-cream-100 border border-cream-300/50"
                    : "hover:bg-cream-50 border border-transparent"
              }`}
            >
              {/* Number / Check circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                  isCompleted
                    ? "bg-accent-green text-white"
                    : isCurrentLevel
                      ? "bg-accent-green text-white"
                      : "bg-cream-200 text-muted"
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>

              {/* Level info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[13px] font-semibold ${
                      isFuture && !isNextLevel
                        ? "text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {level.name} {pathName || ""}
                  </span>
                  <span className="text-[11px] text-muted hidden sm:inline">
                    {level.experience}
                  </span>
                  {isCurrentLevel && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-green text-white text-[10px] font-semibold">
                      Du
                    </span>
                  )}
                  {isNextLevel && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cream-300 text-foreground text-[10px] font-semibold">
                      Nächstes Ziel
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-greenLight text-accent-green text-[10px] font-semibold">
                      <Check className="h-2.5 w-2.5" />
                      {level.id.charAt(0).toUpperCase() + level.id.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress + Chevron */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {(isCurrentLevel || isCompleted) && (
                  <span
                    className={`text-[12px] font-semibold ${
                      isCompleted ? "text-accent-green" : "text-foreground"
                    }`}
                  >
                    {levelProgress}%
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="ml-10 mr-2 mt-1 mb-2 space-y-4">
                {/* Progress Bar */}
                {(isCurrentLevel || isCompleted) && (
                  <div className="px-1">
                    <ProgressBar value={levelProgress} size="sm" />
                  </div>
                )}

                {/* OKR Erfolge */}
                <div className="p-3 bg-cream-50 rounded-lg border border-cream-200/60">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
                    OKR-Erfolge
                  </p>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-medium ${
                          isCompleted || (isCurrentLevel && i < 2)
                            ? "bg-accent-green text-white"
                            : "bg-cream-200 text-muted"
                        }`}
                      >
                        {isCompleted || (isCurrentLevel && i < 2) ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1.5">
                    {isCompleted ? 4 : isCurrentLevel ? 2 : 0} von 4 OKRs mit
                    Score ≥ 0.7
                  </p>
                </div>

                {/* Anforderungen */}
                <div>
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">
                    Anforderungen
                  </p>
                  <div className="space-y-1">
                    {level.requirements.map((req, idx) => {
                      const isFulfilled =
                        isCompleted || (isCurrentLevel && idx < reqFulfilled);
                      const isInProgress =
                        isCurrentLevel &&
                        idx >= reqFulfilled &&
                        idx < reqFulfilled + 1;

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 px-2 py-1.5 rounded-md"
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isFulfilled
                                ? "bg-accent-green text-white"
                                : isInProgress
                                  ? "bg-amber-400 text-white"
                                  : "bg-cream-200 text-muted"
                            }`}
                          >
                            {isFulfilled ? (
                              <Check className="h-3 w-3" />
                            ) : isInProgress ? (
                              <Minus className="h-3 w-3" />
                            ) : (
                              <Circle className="h-2.5 w-2.5" />
                            )}
                          </div>
                          <span
                            className={`text-[12px] leading-relaxed ${
                              isFulfilled ? "text-muted" : "text-foreground"
                            }`}
                          >
                            {req}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Skills / KI-Integration */}
                {level.aiIntegration.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {level.aiIntegration.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2.5 py-1 rounded-full bg-cream-200/80 text-[11px] text-foreground font-medium"
                        >
                          {item.length > 55 ? item.substring(0, 55) + "…" : item}
                        </span>
                      ))}
                      {level.skills?.map((skill, idx) => (
                        <span
                          key={`s-${idx}`}
                          className="inline-flex px-2.5 py-1 rounded-full bg-purple-100 text-[11px] text-purple-700 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verantwortungsbereiche */}
                <div>
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">
                    Verantwortungsbereiche
                  </p>
                  <ul className="space-y-1 px-1">
                    {level.responsibilities.map((resp, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[12px] text-foreground leading-relaxed"
                      >
                        <span className="text-muted mt-1.5 flex-shrink-0">•</span>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
