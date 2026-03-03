"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  Check,
  Clock,
  CheckCircle2,
  X,
  ArrowUpRight,
  Save,
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

export function CareerLadder({
  levels,
  currentLevelId,
  pathId,
  pathName,
}: CareerLadderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
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

  // Set status directly (not cycling)
  const handleSetStatus = (
    levelId: string,
    reqIdx: number,
    newStatus: ReqStatus
  ) => {
    const existingNotes = getCompletion(levelId, reqIdx)?.notes ?? null;
    const current = getReqStatus(levelId, reqIdx);
    const isNewlyActivated =
      current === "not_started" && newStatus !== "not_started";

    // If switching TO not_started, clear notes
    if (newStatus === "not_started") {
      updateRequirement.mutate({
        career_path_id: pathId,
        level_id: levelId,
        requirement_index: reqIdx,
        status: newStatus,
        notes: null,
      });
      setEditingNote(null);
      return;
    }

    updateRequirement.mutate({
      career_path_id: pathId,
      level_id: levelId,
      requirement_index: reqIdx,
      status: newStatus,
      notes: existingNotes,
    });

    // Open note editor when first activating a requirement
    if (isNewlyActivated) {
      const key = `${levelId}-${reqIdx}`;
      setEditingNote(key);
      setNoteText("");
    }
  };

  const handleSaveNote = (levelId: string, reqIdx: number) => {
    const current = getReqStatus(levelId, reqIdx);
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
                  ? "bg-cream-100 border border-cream-300/60"
                  : isExpanded
                    ? "bg-cream-100 border border-cream-300/50"
                    : "hover:bg-cream-50 border border-transparent"
              }`}
            >
              {/* Number / Check circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                  isCompleted || (fulfilled === reqCount && reqCount > 0)
                    ? "bg-foreground text-white"
                    : isCurrentLevel
                      ? "bg-foreground text-white"
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-foreground text-white text-[10px] font-semibold">
                      Du
                    </span>
                  )}
                  {isNextLevel && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cream-300 text-foreground text-[10px] font-semibold">
                      Nächstes Ziel
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream-200 text-foreground text-[10px] font-semibold">
                      <Check className="h-2.5 w-2.5" />
                      {level.id.charAt(0).toUpperCase() + level.id.slice(1)}
                    </span>
                  )}
                </div>
                {(fulfilled > 0 || inProgress > 0) && (
                  <p className="text-[11px] text-muted mt-0.5">
                    {fulfilled}/{reqCount} erfüllt
                    {inProgress > 0 && ` · ${inProgress} aufbauend`}
                  </p>
                )}
              </div>

              {/* Progress + Chevron */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {(fulfilled > 0 || isCurrentLevel || isCompleted) && (
                  <span className="text-[12px] font-semibold text-foreground">
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

            {/* ===== Expanded Content — White Card ===== */}
            {isExpanded && (
              <div className="mt-2 mb-3 ml-5 mr-1">
                <div className="bg-white rounded-xl border border-cream-200/80 shadow-sm overflow-hidden">
                  {/* Top bar — progress summary */}
                  <div className="px-5 pt-4 pb-3 border-b border-cream-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[12px] font-semibold text-foreground">
                        Fortschritt — {level.name}
                      </h3>
                      <span className="text-[12px] font-semibold text-foreground">
                        {fulfilled}/{reqCount} erfüllt
                      </span>
                    </div>
                    <ProgressBar value={levelProgress} size="sm" />
                    <div className="flex items-center gap-4 mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                        <span className="text-[10px] text-muted">
                          {fulfilled} Erfüllt
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-muted">
                          {inProgress} Aufbauend
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-cream-200" />
                        <span className="text-[10px] text-muted">
                          {reqCount - fulfilled - inProgress} Offen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OKR Qualification */}
                  <div className="px-5 py-3 border-b border-cream-100 bg-cream-50/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        <span className="text-[11px] text-muted">
                          OKR-Qualifikation
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-foreground">
                        {isCompleted ? 4 : isCurrentLevel ? 2 : 0}/4 mit Score
                        ≥ 0.7
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full ${
                            isCompleted || (isCurrentLevel && i < 2)
                              ? "bg-foreground"
                              : "bg-cream-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ===== Requirements — Interactive ===== */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                      Anforderungen
                    </p>
                    <div className="space-y-3">
                      {level.requirements.map((req, idx) => {
                        const status = getReqStatus(level.id, idx);
                        const completion = getCompletion(level.id, idx);
                        const noteKey = `${level.id}-${idx}`;
                        const isEditingThis = editingNote === noteKey;

                        return (
                          <div
                            key={idx}
                            className={`rounded-lg border transition-colors ${
                              status === "completed"
                                ? "border-cream-200 bg-cream-50/50"
                                : status === "in_progress"
                                  ? "border-amber-200/60 bg-amber-50/20"
                                  : "border-cream-200/60 bg-white"
                            }`}
                          >
                            {/* Requirement text */}
                            <div className="px-4 pt-3 pb-2">
                              <p
                                className={`text-[12px] leading-relaxed ${
                                  status === "completed"
                                    ? "text-muted"
                                    : "text-foreground"
                                }`}
                              >
                                {req}
                              </p>
                            </div>

                            {/* Status selector — 3 buttons */}
                            <div className="px-4 pb-3">
                              <div className="flex items-center gap-1.5">
                                {/* Nicht erfüllt */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetStatus(
                                      level.id,
                                      idx,
                                      "not_started"
                                    );
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                    status === "not_started"
                                      ? "bg-cream-200 text-foreground ring-1 ring-cream-300"
                                      : "bg-cream-50 text-muted hover:bg-cream-100"
                                  }`}
                                >
                                  <X className="h-3 w-3" />
                                  <span className="hidden sm:inline">
                                    Nicht erfüllt
                                  </span>
                                  <span className="sm:hidden">Offen</span>
                                </button>

                                {/* Aufbauend */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetStatus(
                                      level.id,
                                      idx,
                                      "in_progress"
                                    );
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                    status === "in_progress"
                                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                      : "bg-cream-50 text-muted hover:bg-cream-100"
                                  }`}
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                  Aufbauend
                                </button>

                                {/* Erfüllt */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetStatus(
                                      level.id,
                                      idx,
                                      "completed"
                                    );
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                    status === "completed"
                                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                      : "bg-cream-50 text-muted hover:bg-cream-100"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Erfüllt
                                </button>
                              </div>
                            </div>

                            {/* Justification / Notes — visible when not "not_started" */}
                            {status !== "not_started" && (
                              <div className="px-4 pb-3 border-t border-cream-100/80">
                                {isEditingThis ? (
                                  <div className="pt-2.5">
                                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                                      Begründung / Nachweis
                                    </label>
                                    <textarea
                                      value={noteText}
                                      onChange={(e) =>
                                        setNoteText(e.target.value)
                                      }
                                      placeholder="Wie belegst du diese Kompetenz? (z.B. Projekte, Zertifikate, Feedback...)"
                                      className="w-full mt-1.5 px-3 py-2 text-[12px] bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cream-400 resize-none leading-relaxed"
                                      rows={2}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveNote(level.id, idx);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground text-white rounded-md text-[11px] font-medium hover:bg-foreground/80 transition-colors"
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
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cream-100 text-muted rounded-md text-[11px] font-medium hover:bg-cream-200 transition-colors"
                                      >
                                        Abbrechen
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="pt-2.5 cursor-pointer group/note"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditNote(level.id, idx);
                                    }}
                                  >
                                    {completion?.notes ? (
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                                            Begründung
                                          </p>
                                          <p className="text-[12px] text-foreground/70 leading-relaxed group-hover/note:text-foreground transition-colors">
                                            {completion.notes}
                                          </p>
                                        </div>
                                        <span className="text-[10px] text-muted opacity-0 group-hover/note:opacity-100 transition-opacity mt-3 flex-shrink-0">
                                          Bearbeiten
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-muted/60 italic group-hover/note:text-muted transition-colors">
                                        + Begründung hinzufügen — Wie belegst du
                                        diese Kompetenz?
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skills */}
                  {(level.aiIntegration.length > 0 ||
                    (level.skills && level.skills.length > 0)) && (
                    <div className="px-5 py-3 border-t border-cream-100">
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
                        Skills & Kompetenzen
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {level.aiIntegration.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-2.5 py-1 rounded-full bg-cream-100 text-[11px] text-foreground/70 font-medium"
                          >
                            {item.length > 55
                              ? item.substring(0, 55) + "…"
                              : item}
                          </span>
                        ))}
                        {level.skills?.map((skill, idx) => (
                          <span
                            key={`s-${idx}`}
                            className="inline-flex px-2.5 py-1 rounded-full bg-cream-100 text-[11px] text-foreground/70 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verantwortungsbereiche */}
                  <div className="px-5 py-3 border-t border-cream-100">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
                      Verantwortungsbereiche
                    </p>
                    <div className="space-y-1">
                      {level.responsibilities.map((resp, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[12px] text-foreground/70 leading-relaxed"
                        >
                          <span className="text-cream-400 mt-1 flex-shrink-0 text-[8px]">
                            ●
                          </span>
                          {resp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
