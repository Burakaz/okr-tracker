"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  Check,
  Clock,
  CheckCircle2,
  Circle,
  Minus,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  useRequirementCompletions,
  useUpdateRequirement,
  type RequirementCompletion,
} from "@/lib/queries";
import type { CareerPathLevel } from "@/lib/career-paths";

interface CareerLadderProps {
  levels: CareerPathLevel[];
  currentLevelId?: string | null;
  pathId: string;
  pathName?: string;
}

type ReqStatus = "not_started" | "in_progress" | "completed";

const NEXT_STATUS: Record<ReqStatus, ReqStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

export function CareerLadder({
  levels,
  currentLevelId,
  pathId,
  pathName,
}: CareerLadderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null); // "levelId-reqIdx"
  const [noteText, setNoteText] = useState("");

  const { data: completionsData } = useRequirementCompletions();
  const updateRequirement = useUpdateRequirement();

  const completions = completionsData?.completions ?? [];

  const currentIndex = currentLevelId
    ? levels.findIndex((l) => l.id === currentLevelId)
    : 0;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingNote(null);
  };

  // Get completion status for a specific requirement
  const getCompletion = useCallback(
    (levelId: string, reqIdx: number): RequirementCompletion | undefined => {
      return completions.find(
        (c) =>
          c.career_path_id === pathId &&
          c.level_id === levelId &&
          c.requirement_index === reqIdx
      );
    },
    [completions, pathId]
  );

  const getReqStatus = useCallback(
    (levelId: string, reqIdx: number): ReqStatus => {
      return getCompletion(levelId, reqIdx)?.status ?? "not_started";
    },
    [getCompletion]
  );

  // Count fulfilled requirements for a level
  const countFulfilled = useCallback(
    (levelId: string, reqCount: number) => {
      let fulfilled = 0;
      let inProgress = 0;
      for (let i = 0; i < reqCount; i++) {
        const status = getReqStatus(levelId, i);
        if (status === "completed") fulfilled++;
        if (status === "in_progress") inProgress++;
      }
      return { fulfilled, inProgress };
    },
    [getReqStatus]
  );

  // Toggle requirement status
  const handleToggleStatus = (levelId: string, reqIdx: number) => {
    const current = getReqStatus(levelId, reqIdx);
    const next = NEXT_STATUS[current];
    const existingNotes = getCompletion(levelId, reqIdx)?.notes ?? null;
    updateRequirement.mutate({
      career_path_id: pathId,
      level_id: levelId,
      requirement_index: reqIdx,
      status: next,
      notes: existingNotes,
    });
  };

  // Save note
  const handleSaveNote = (levelId: string, reqIdx: number) => {
    const current = getReqStatus(levelId, reqIdx);
    // If not started and adding a note, set to in_progress
    const status = current === "not_started" ? "in_progress" : current;
    updateRequirement.mutate({
      career_path_id: pathId,
      level_id: levelId,
      requirement_index: reqIdx,
      status,
      notes: noteText.trim() || null,
    });
    setEditingNote(null);
    setNoteText("");
  };

  const startEditNote = (levelId: string, reqIdx: number) => {
    const key = `${levelId}-${reqIdx}`;
    const existing = getCompletion(levelId, reqIdx)?.notes ?? "";
    setEditingNote(key);
    setNoteText(existing);
  };

  return (
    <div className="space-y-1.5">
      {levels.map((level, index) => {
        const isCurrentLevel = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isNextLevel = index === currentIndex + 1;
        const isFuture = index > currentIndex;
        const isExpanded = expandedId === level.id;

        const reqCount = level.requirements.length;
        const { fulfilled, inProgress } = countFulfilled(level.id, reqCount);
        const levelProgress =
          reqCount > 0 ? Math.round((fulfilled / reqCount) * 100) : 0;

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
                  isCompleted || (fulfilled === reqCount && reqCount > 0)
                    ? "bg-accent-green text-white"
                    : isCurrentLevel
                      ? "bg-accent-green text-white"
                      : "bg-cream-200 text-muted"
                }`}
              >
                {isCompleted || (fulfilled === reqCount && reqCount > 0) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
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
                {/* Inline progress summary */}
                {(fulfilled > 0 || inProgress > 0) && (
                  <p className="text-[11px] text-muted mt-0.5">
                    {fulfilled}/{reqCount} erledigt
                    {inProgress > 0 && ` · ${inProgress} in Arbeit`}
                  </p>
                )}
              </div>

              {/* Progress + Chevron */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {(fulfilled > 0 || isCurrentLevel || isCompleted) && (
                  <span
                    className={`text-[12px] font-semibold ${
                      levelProgress === 100
                        ? "text-accent-green"
                        : "text-foreground"
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
                <div className="px-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted">
                      {fulfilled} von {reqCount} Anforderungen
                    </span>
                    <span className="text-[10px] font-semibold text-foreground">
                      {levelProgress}%
                    </span>
                  </div>
                  <ProgressBar value={levelProgress} size="sm" />
                </div>

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

                {/* Anforderungen — Interactive */}
                <div>
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">
                    Anforderungen
                  </p>
                  <div className="space-y-0.5">
                    {level.requirements.map((req, idx) => {
                      const status = getReqStatus(level.id, idx);
                      const completion = getCompletion(level.id, idx);
                      const noteKey = `${level.id}-${idx}`;
                      const isEditingThis = editingNote === noteKey;

                      return (
                        <div key={idx} className="group">
                          <div className="flex items-start gap-2.5 px-2 py-2 rounded-md hover:bg-cream-50/80 transition-colors">
                            {/* Clickable status toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(level.id, idx);
                              }}
                              className="flex-shrink-0 mt-0.5 focus:outline-none"
                              title={
                                status === "not_started"
                                  ? "Als in Arbeit markieren"
                                  : status === "in_progress"
                                    ? "Als erledigt markieren"
                                    : "Zurücksetzen"
                              }
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                  status === "completed"
                                    ? "bg-accent-green text-white hover:bg-green-600"
                                    : status === "in_progress"
                                      ? "bg-amber-400 text-white hover:bg-amber-500"
                                      : "bg-cream-200 text-muted hover:bg-cream-300"
                                }`}
                              >
                                {status === "completed" ? (
                                  <Check className="h-3 w-3" />
                                ) : status === "in_progress" ? (
                                  <Minus className="h-3 w-3" />
                                ) : (
                                  <Circle className="h-2.5 w-2.5" />
                                )}
                              </div>
                            </button>

                            {/* Requirement text + note button */}
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-[12px] leading-relaxed ${
                                  status === "completed"
                                    ? "text-muted line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {req}
                              </span>

                              {/* Existing note display */}
                              {completion?.notes && !isEditingThis && (
                                <div
                                  className="mt-1 px-2 py-1.5 bg-cream-100 rounded text-[11px] text-muted leading-relaxed cursor-pointer hover:bg-cream-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditNote(level.id, idx);
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3 inline mr-1 -mt-0.5" />
                                  {completion.notes}
                                </div>
                              )}
                            </div>

                            {/* Note action button */}
                            {!isEditingThis && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditNote(level.id, idx);
                                }}
                                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Notiz hinzufügen"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-muted hover:text-foreground" />
                              </button>
                            )}
                          </div>

                          {/* Note editor */}
                          {isEditingThis && (
                            <div className="ml-8 mr-2 mb-1 mt-0.5">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Notiz hinzufügen..."
                                className="w-full px-3 py-2 text-[12px] bg-white border border-cream-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-green resize-none"
                                rows={2}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveNote(level.id, idx);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-green text-white rounded text-[11px] font-medium hover:bg-green-600 transition-colors"
                                >
                                  <Save className="h-3 w-3" />
                                  Speichern
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNote(null);
                                    setNoteText("");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-cream-200 text-muted rounded text-[11px] font-medium hover:bg-cream-300 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          )}
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
                          {item.length > 55
                            ? item.substring(0, 55) + "…"
                            : item}
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
                        <span className="text-muted mt-1.5 flex-shrink-0">
                          •
                        </span>
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
