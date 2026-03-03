"use client";

import { useState, useCallback } from "react";
import {
  ChevronDown,
  Check,
  Clock,
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

// Index offsets to separate item types in the same DB table
const SKILL_OFFSET = 1000;
const RESP_OFFSET = 2000;

/** Combine aiIntegration + skills into one list */
function getAllSkills(level: CareerPathLevel): string[] {
  const items = [...level.aiIntegration];
  if (level.skills) items.push(...level.skills);
  return items;
}

/* ─── Compact 3-circle status selector ──────────────────────────────── */

function StatusCircles({
  status,
  onSet,
}: {
  status: ReqStatus;
  onSet: (s: ReqStatus) => void;
}) {
  return (
    <div className="flex items-center gap-[3px] flex-shrink-0">
      {/* Not started — X */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSet("not_started");
        }}
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all ${
          status === "not_started"
            ? "bg-cream-300 text-foreground/50 ring-1 ring-cream-400/40"
            : "bg-cream-100 text-cream-300 hover:bg-cream-200 hover:text-cream-400"
        }`}
        title="Nicht erfüllt"
      >
        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>

      {/* In progress — Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSet("in_progress");
        }}
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all ${
          status === "in_progress"
            ? "bg-amber-400 text-white ring-1 ring-amber-500/30"
            : "bg-cream-100 text-cream-300 hover:bg-amber-100 hover:text-amber-500"
        }`}
        title="Aufbauend"
      >
        <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>

      {/* Completed — Check */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSet("completed");
        }}
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all ${
          status === "completed"
            ? "bg-emerald-500 text-white ring-1 ring-emerald-600/30"
            : "bg-cream-100 text-cream-300 hover:bg-emerald-100 hover:text-emerald-500"
        }`}
        title="Erfüllt"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

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

  const getStatus = useCallback(
    (levelId: string, reqIdx: number): ReqStatus => {
      return getCompletion(levelId, reqIdx)?.status ?? "not_started";
    },
    [getCompletion]
  );

  /** Count fulfilled / inProgress across ALL item types for a level */
  const countAll = useCallback(
    (level: CareerPathLevel) => {
      let fulfilled = 0;
      let inProgress = 0;
      let total = 0;

      // Requirements (indices 0..N-1)
      for (let i = 0; i < level.requirements.length; i++) {
        total++;
        const s = getStatus(level.id, i);
        if (s === "completed") fulfilled++;
        else if (s === "in_progress") inProgress++;
      }

      // Skills (indices SKILL_OFFSET+0..)
      const skills = getAllSkills(level);
      for (let i = 0; i < skills.length; i++) {
        total++;
        const s = getStatus(level.id, SKILL_OFFSET + i);
        if (s === "completed") fulfilled++;
        else if (s === "in_progress") inProgress++;
      }

      // Responsibilities (indices RESP_OFFSET+0..)
      for (let i = 0; i < level.responsibilities.length; i++) {
        total++;
        const s = getStatus(level.id, RESP_OFFSET + i);
        if (s === "completed") fulfilled++;
        else if (s === "in_progress") inProgress++;
      }

      return { fulfilled, inProgress, total };
    },
    [getStatus]
  );

  /* ─── Status / Note handlers ──────────────────────────────────────── */

  const handleSetStatus = (
    levelId: string,
    reqIdx: number,
    newStatus: ReqStatus
  ) => {
    const existingNotes = getCompletion(levelId, reqIdx)?.notes ?? null;
    const current = getStatus(levelId, reqIdx);
    const isNewlyActivated =
      current === "not_started" && newStatus !== "not_started";

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

    if (isNewlyActivated) {
      setEditingNote(`${levelId}-${reqIdx}`);
      setNoteText("");
    }
  };

  const handleSaveNote = (levelId: string, reqIdx: number) => {
    const current = getStatus(levelId, reqIdx);
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
    const existing = getCompletion(levelId, reqIdx)?.notes ?? "";
    setEditingNote(`${levelId}-${reqIdx}`);
    setNoteText(existing);
  };

  /* ─── Reusable interactive item row ───────────────────────────────── */

  const renderItemRow = (
    levelId: string,
    reqIdx: number,
    text: string,
    isLast: boolean
  ) => {
    const status = getStatus(levelId, reqIdx);
    const completion = getCompletion(levelId, reqIdx);
    const noteKey = `${levelId}-${reqIdx}`;
    const isEditingThis = editingNote === noteKey;

    return (
      <div
        key={reqIdx}
        className={!isLast ? "border-b border-cream-100/60" : ""}
      >
        <div className="flex items-start gap-2.5 py-[7px] px-1">
          <div className="mt-[2px]">
            <StatusCircles
              status={status}
              onSet={(s) => handleSetStatus(levelId, reqIdx, s)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[12px] leading-relaxed ${
                status === "completed"
                  ? "text-muted line-through decoration-cream-300"
                  : status === "in_progress"
                    ? "text-foreground"
                    : "text-foreground/70"
              }`}
            >
              {text}
            </p>

            {/* Note / Justification */}
            {status !== "not_started" && (
              <div className="mt-1">
                {isEditingThis ? (
                  <div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Wie belegst du diese Kompetenz?"
                      className="w-full px-2.5 py-1.5 text-[11px] bg-cream-50 border border-cream-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cream-400 resize-none leading-relaxed"
                      rows={2}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveNote(levelId, reqIdx);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-foreground text-white rounded-md text-[10px] font-medium hover:bg-foreground/80 transition-colors"
                      >
                        <Save className="h-2.5 w-2.5" />
                        Speichern
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(null);
                          setNoteText("");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cream-100 text-muted rounded-md text-[10px] font-medium hover:bg-cream-200 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : completion?.notes ? (
                  <p
                    className="text-[11px] text-muted leading-relaxed cursor-pointer hover:text-foreground/70 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditNote(levelId, reqIdx);
                    }}
                  >
                    {completion.notes}
                  </p>
                ) : (
                  <p
                    className="text-[10px] text-muted/40 italic cursor-pointer hover:text-muted/60 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditNote(levelId, reqIdx);
                    }}
                  >
                    + Begründung hinzufügen
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-1.5">
      {levels.map((level, index) => {
        const isCurrentLevel = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isNextLevel = index === currentIndex + 1;
        const isFuture = index > currentIndex;
        const isExpanded = expandedId === level.id;

        const { fulfilled, inProgress, total } = countAll(level);
        const levelProgress =
          total > 0 ? Math.round((fulfilled / total) * 100) : 0;

        const skills = getAllSkills(level);

        return (
          <div key={level.id}>
            {/* ─── Level Row (collapsed) ─── */}
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
                  isCompleted || (fulfilled === total && total > 0)
                    ? "bg-foreground text-white"
                    : isCurrentLevel
                      ? "bg-foreground text-white"
                      : "bg-cream-200 text-muted"
                }`}
              >
                {isCompleted || (fulfilled === total && total > 0) ? (
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
                    {fulfilled}/{total} erfüllt
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

            {/* ═══ Expanded Content — White Card ═══ */}
            {isExpanded && (
              <div className="mt-2 mb-3 ml-5 mr-1">
                <div className="bg-white rounded-xl border border-cream-200/80 shadow-sm overflow-hidden">
                  {/* ─── Progress summary ─── */}
                  <div className="px-5 pt-4 pb-3 border-b border-cream-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[12px] font-semibold text-foreground">
                        Fortschritt — {level.name}
                      </h3>
                      <span className="text-[12px] font-semibold text-foreground">
                        {fulfilled}/{total} erfüllt
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
                          {total - fulfilled - inProgress} Offen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── OKR Qualification ─── */}
                  <div className="px-5 py-2.5 border-b border-cream-100 bg-cream-50/40">
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
                    <div className="flex items-center gap-1 mt-1.5">
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

                  {/* ─── Anforderungen ─── */}
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 px-1">
                      Anforderungen
                    </p>
                    {level.requirements.map((req, idx) =>
                      renderItemRow(
                        level.id,
                        idx,
                        req,
                        idx === level.requirements.length - 1
                      )
                    )}
                  </div>

                  {/* ─── Skills & KI-Integration ─── */}
                  {skills.length > 0 && (
                    <div className="px-4 pt-3 pb-2 border-t border-cream-100">
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 px-1">
                        Skills & KI-Integration
                      </p>
                      {skills.map((skill, idx) =>
                        renderItemRow(
                          level.id,
                          SKILL_OFFSET + idx,
                          skill,
                          idx === skills.length - 1
                        )
                      )}
                    </div>
                  )}

                  {/* ─── Verantwortungsbereiche ─── */}
                  <div className="px-4 pt-3 pb-2 border-t border-cream-100">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 px-1">
                      Verantwortungsbereiche
                    </p>
                    {level.responsibilities.map((resp, idx) =>
                      renderItemRow(
                        level.id,
                        RESP_OFFSET + idx,
                        resp,
                        idx === level.responsibilities.length - 1
                      )
                    )}
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
