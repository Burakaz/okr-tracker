"use client";

import { useState } from "react";
import {
  ChevronDown,
  ClipboardCheck,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Clock,
  CheckCheck,
  Minus,
  X,
  Zap,
  Target,
  BookOpen,
  Briefcase,
  Check,
  History,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  isCheckinOverdue,
  getCheckinDaysRemaining,
} from "@/lib/okr-logic";
import type { OKR, OKRStatus, OKRCategory, KeyResult } from "@/types";

interface OKRAccordionItemProps {
  okr: OKR;
  isExpanded: boolean;
  onToggle: () => void;
  onCheckin: (okr: OKR) => void;
  onEdit: (okr: OKR) => void;
  onArchive: (okr: OKR) => void;
  onDuplicate: (okr: OKR) => void;
  onDelete: (okr: OKR) => void;
  onQuickCheckin?: (
    okr: OKR,
    data: {
      confidence: number;
      note?: string;
      key_result_updates?: Array<{ id: string; current_value: number }>;
    }
  ) => void;
  onUpdateKR?: (okrId: string, krId: string, newValue: number) => void;
}

// ===== Helpers =====

function getStatusColor(status: OKRStatus): "green" | "amber" | "red" {
  switch (status) {
    case "on_track": return "green";
    case "at_risk": return "amber";
    case "off_track": return "red";
  }
}

function getScoreTextColor(status: OKRStatus): string {
  switch (status) {
    case "on_track": return "text-green-600";
    case "at_risk": return "text-amber-500";
    case "off_track": return "text-red-500";
  }
}

const categoryConfig: Record<OKRCategory, { icon: typeof Zap; label: string; className: string }> = {
  performance: { icon: Zap, label: "Perf", className: "badge-green" },
  skill: { icon: Target, label: "Skill", className: "badge-blue" },
  learning: { icon: BookOpen, label: "Lernen", className: "badge-yellow" },
  career: { icon: Briefcase, label: "Karriere", className: "badge-gray" },
};

const statusBadgeConfig: Record<OKRStatus, { label: string; className: string }> = {
  on_track: { label: "On Track", className: "badge-green" },
  at_risk: { label: "At Risk", className: "badge-yellow" },
  off_track: { label: "Kritisch", className: "badge-red" },
};

function StatusIndicatorIcon({ status }: { status: OKRStatus }) {
  switch (status) {
    case "on_track":
      return <CheckCheck className="h-3.5 w-3.5 text-green-600" aria-label="On Track" />;
    case "at_risk":
      return <Minus className="h-3.5 w-3.5 text-amber-500" aria-label="At Risk" />;
    case "off_track":
      return <X className="h-3.5 w-3.5 text-red-500" aria-label="Kritisch" />;
  }
}

const confidenceOptions = [
  { value: 5, emoji: "🟢", label: "Sehr gut" },
  { value: 4, emoji: "😊", label: "Gut" },
  { value: 3, emoji: "😐", label: "Risiko" },
  { value: 2, emoji: "😟", label: "Kritisch" },
] as const;

function getKRProgress(kr: KeyResult, value: number) {
  const range = kr.target_value - kr.start_value;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((value - kr.start_value) / range) * 100));
}

function getSliderStep(kr: KeyResult) {
  const range = kr.target_value - kr.start_value;
  if (range <= 10) return 0.1;
  if (range <= 100) return 1;
  if (range <= 1000) return 5;
  return Math.round(range / 100);
}

// ===== Component =====

export function OKRAccordionItem({
  okr,
  isExpanded,
  onToggle,
  onCheckin,
  onEdit,
  onArchive,
  onDuplicate,
  onDelete,
  onQuickCheckin,
}: OKRAccordionItemProps) {
  const [checkinMode, setCheckinMode] = useState(false);
  const [krValues, setKrValues] = useState<Record<string, number>>({});
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null);

  const score = (okr.progress / 100).toFixed(2);
  const statusColor = getStatusColor(okr.status);
  const cat = categoryConfig[okr.category];
  const statusCfg = statusBadgeConfig[okr.status];
  const overdue = isCheckinOverdue(okr.next_checkin_at);
  const daysRemaining = getCheckinDaysRemaining(okr.next_checkin_at);
  const CatIcon = cat.icon;

  const enterCheckinMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const initial: Record<string, number> = {};
    okr.key_results?.forEach((kr) => {
      initial[kr.id] = kr.current_value;
    });
    setKrValues(initial);
    setSelectedConfidence(null);
    setCheckinMode(true);
  };

  const cancelCheckin = () => {
    setCheckinMode(false);
    setKrValues({});
    setSelectedConfidence(null);
  };

  const saveCheckin = () => {
    if (selectedConfidence === null) return;
    const updates = Object.entries(krValues)
      .filter(([id]) => {
        const kr = okr.key_results?.find((k) => k.id === id);
        return kr && krValues[id] !== kr.current_value;
      })
      .map(([id, current_value]) => ({ id, current_value }));

    onQuickCheckin?.(okr, {
      confidence: selectedConfidence,
      key_result_updates: updates.length > 0 ? updates : undefined,
    });
    cancelCheckin();
  };

  return (
    <div className="card">
      <div className="p-4 sm:p-5">
        {/* Row 1: Title + Chevron */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          className="flex items-start justify-between gap-3 cursor-pointer group"
          aria-expanded={isExpanded}
          aria-controls={`okr-detail-${okr.id}`}
        >
          <h3 className="text-[16px] font-semibold text-foreground leading-tight">
            {okr.title}
          </h3>
          <ChevronDown
            className={`h-4 w-4 text-cream-400 flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:text-muted ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </div>

        {/* Row 2: Badges (left) + Score Area (right) */}
        <div className="flex items-center justify-between mt-3 gap-4">
          {/* Left: Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`badge ${cat.className} gap-1`}>
              <CatIcon className="h-3 w-3" aria-hidden="true" />
              {cat.label}
            </span>
            <span className="text-[11px] text-muted bg-cream-100 px-2 py-0.5 rounded-full">
              {okr.quarter}
            </span>
            <span className={`badge ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            {overdue && (
              <span className="badge badge-red gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Überfällig
              </span>
            )}
          </div>

          {/* Right: Progress Bar + Score + Icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ProgressBar
              value={okr.progress}
              size="sm"
              color={statusColor}
              marker={70}
              className="w-20 sm:w-28"
            />
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={`text-[18px] font-bold leading-none tabular-nums ${getScoreTextColor(okr.status)}`}
              >
                {score}
              </span>
              <StatusIndicatorIcon status={okr.status} />
            </div>
          </div>
        </div>

        {/* Row 3: Key Results — static or with sliders in check-in mode */}
        {okr.key_results && okr.key_results.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {okr.key_results.map((kr) => {
              const currentVal = checkinMode
                ? (krValues[kr.id] ?? kr.current_value)
                : kr.current_value;
              const progress = checkinMode
                ? getKRProgress(kr, currentVal)
                : kr.progress;

              return (
                <div key={kr.id} className="flex items-center gap-3">
                  <span className="text-[13px] text-foreground truncate w-[40%] sm:w-[45%] flex-shrink-0">
                    {kr.title}
                  </span>
                  <div className="flex-1 relative min-w-0">
                    <ProgressBar
                      value={progress}
                      size="xs"
                      color={statusColor}
                      className="w-full"
                    />
                    {checkinMode && (
                      <input
                        type="range"
                        min={kr.start_value}
                        max={kr.target_value}
                        step={getSliderStep(kr)}
                        value={currentVal}
                        onChange={(e) =>
                          setKrValues((prev) => ({
                            ...prev,
                            [kr.id]: Number(e.target.value),
                          }))
                        }
                        className="kr-slider"
                        aria-label={`${kr.title} anpassen`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[12px] tabular-nums whitespace-nowrap flex-shrink-0 ${
                      checkinMode ? "text-foreground font-medium" : "text-muted"
                    }`}
                  >
                    {currentVal} / {kr.target_value}
                    {kr.unit ? ` ${kr.unit}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Check-in mode: Confidence selector */}
        {checkinMode && (
          <div className="mt-4 pt-3 border-t border-cream-200">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
              Wie zuversichtlich bist du?
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {confidenceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedConfidence(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    selectedConfidence === opt.value
                      ? "bg-foreground text-white"
                      : "bg-cream-100 text-muted hover:bg-cream-200"
                  }`}
                  aria-pressed={selectedConfidence === opt.value}
                >
                  <span aria-hidden="true">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-cream-200">
          {checkinMode ? (
            <>
              <button
                type="button"
                onClick={cancelCheckin}
                className="text-[12px] text-muted hover:text-foreground transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveCheckin}
                disabled={selectedConfidence === null}
                className="btn-success text-[12px] py-1.5 px-4 gap-1.5"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Speichern
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={enterCheckinMode}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-foreground text-white px-3 py-1.5 rounded-lg hover:bg-foreground/90 transition-colors"
                aria-label={`Check-in für "${okr.title}"`}
              >
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Check-in
              </button>

              {daysRemaining !== null && (
                <span
                  className={`flex items-center gap-1.5 text-[12px] ${
                    overdue ? "text-red-500 font-medium" : "text-muted"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {overdue
                    ? `${Math.abs(daysRemaining)} Tage überfällig`
                    : `In ${daysRemaining} Tagen`}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Expanded: Additional Info + Actions (seamless, same background) ===== */}
      {isExpanded && !checkinMode && (
        <div
          id={`okr-detail-${okr.id}`}
          className="px-4 sm:px-5 pb-4 space-y-3"
        >
          {/* Why it matters */}
          {okr.why_it_matters && (
            <div>
              <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Warum wichtig?
              </h4>
              <p className="text-[13px] text-muted leading-relaxed">
                {okr.why_it_matters}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-200">
            <button
              onClick={() => onCheckin(okr)}
              className="btn-ghost text-[12px] py-1.5 px-3 gap-1.5"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              Ausführliches Check-in
            </button>
            <button
              onClick={() => onEdit(okr)}
              className="btn-ghost text-[12px] py-1.5 px-3 gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Bearbeiten
            </button>
            <button
              onClick={() => onDuplicate(okr)}
              className="btn-ghost text-[12px] py-1.5 px-3 gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Duplizieren
            </button>
            <button
              onClick={() => onArchive(okr)}
              className="btn-ghost text-[12px] py-1.5 px-3 gap-1.5"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              Archivieren
            </button>

            <div className="flex-1" />

            <button
              onClick={() => onDelete(okr)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Löschen"
              aria-label={`"${okr.title}" löschen`}
            >
              <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
