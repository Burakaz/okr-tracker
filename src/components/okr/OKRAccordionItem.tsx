"use client";

import {
  ChevronDown,
  Star,
  GripVertical,
  ClipboardCheck,
  History,
  Copy,
  Pencil,
  Archive,
  Trash2,
  Calendar,
  Target,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  progressToScore,
  getCategoryLabel,
  getCategoryClassName,
} from "@/lib/okr-logic";
import type { OKR } from "@/types";

interface OKRAccordionItemProps {
  okr: OKR;
  isExpanded: boolean;
  onToggle: () => void;
  onCheckin: (okr: OKR) => void;
  onEdit: (okr: OKR) => void;
  onFocus: (okr: OKR) => void;
  onArchive: (okr: OKR) => void;
  onDuplicate: (okr: OKR) => void;
  onDelete: (okr: OKR) => void;
}

export function OKRAccordionItem({
  okr,
  isExpanded,
  onToggle,
  onCheckin,
  onEdit,
  onFocus,
  onArchive,
  onDuplicate,
  onDelete,
}: OKRAccordionItemProps) {
  const score = progressToScore(okr.progress);

  return (
    <div
      className={`card overflow-hidden transition-shadow ${
        isExpanded ? "ring-1 ring-cream-300 shadow-md" : ""
      } ${okr.is_focus ? "border-l-4 border-l-accent-green" : ""}`}
    >
      {/* Collapsed row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`okr-detail-${okr.id}`}
      >
        {/* Drag handle (visual only) */}
        <GripVertical
          className="h-4 w-4 text-cream-300 flex-shrink-0 cursor-grab"
          aria-hidden="true"
        />

        {/* Star / Focus toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFocus(okr);
          }}
          className="p-1 hover:bg-cream-200 rounded transition-colors flex-shrink-0"
          aria-label={
            okr.is_focus
              ? `Fokus von "${okr.title}" entfernen`
              : `"${okr.title}" als Fokus setzen`
          }
        >
          <Star
            className={`h-4 w-4 ${
              okr.is_focus
                ? "text-accent-green fill-accent-green"
                : "text-cream-300"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Title */}
        <span className="flex-1 font-medium text-[14px] text-foreground truncate min-w-0">
          {okr.title}
        </span>

        {/* Category badge */}
        <span
          className={`badge ${getCategoryClassName(okr.category)} flex-shrink-0 hidden sm:inline-flex`}
        >
          {getCategoryLabel(okr.category)}
        </span>

        {/* Quarter */}
        <span className="text-[12px] text-muted flex-shrink-0 hidden md:inline">
          {okr.quarter}
        </span>

        {/* Status badge */}
        <StatusBadge status={okr.status} className="flex-shrink-0" />

        {/* Score */}
        <ScoreBadge score={score} className="flex-shrink-0" />

        {/* Check-in button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCheckin(okr);
          }}
          className="btn-success text-[12px] py-1 px-2.5 gap-1 flex-shrink-0"
          aria-label={`Check-in fuer "${okr.title}"`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden lg:inline">Check-in</span>
        </button>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-muted flex-shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          id={`okr-detail-${okr.id}`}
          className="border-t border-cream-200 bg-cream-50/50 px-4 py-4 space-y-4"
        >
          {/* Why it matters */}
          {okr.why_it_matters && (
            <div>
              <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                Warum wichtig?
              </h4>
              <p className="text-[13px] text-foreground leading-relaxed bg-white rounded-lg p-3">
                {okr.why_it_matters}
              </p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {okr.due_date
                ? new Date(okr.due_date).toLocaleDateString("de-DE")
                : "Kein Faelligkeitsdatum"}
            </span>
            <span className={`badge ${getCategoryClassName(okr.category)}`}>
              {getCategoryLabel(okr.category)}
            </span>
            <span className="text-[12px]">Quartal: {okr.quarter}</span>
            <span className="text-[12px]">
              Scope: {okr.scope === "personal" ? "Personal" : okr.scope === "team" ? "Team" : "Company"}
            </span>
          </div>

          {/* Key Results */}
          {okr.key_results && okr.key_results.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Key Results ({okr.key_results.length})
              </h4>
              <div className="space-y-2">
                {okr.key_results.map((kr) => (
                  <div key={kr.id} className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[13px] font-medium text-foreground flex-1 truncate pr-2">
                        {kr.title}
                      </p>
                      <span className="text-[11px] text-muted whitespace-nowrap">
                        {kr.current_value}
                        {kr.unit ? ` ${kr.unit}` : ""} / {kr.target_value}
                        {kr.unit ? ` ${kr.unit}` : ""}
                      </span>
                    </div>
                    <ProgressBar value={kr.progress} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-cream-200">
            <button
              onClick={() => onCheckin(okr)}
              className="btn-success text-[12px] py-1.5 px-3 gap-1.5"
            >
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Check-in
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

            {/* Spacer */}
            <div className="flex-1" />

            <button
              onClick={() => onDelete(okr)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Loeschen"
              aria-label={`"${okr.title}" loeschen`}
            >
              <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
