"use client";

import {
  ChevronDown,
  ClipboardCheck,
  History,
  Copy,
  Pencil,
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
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { KRInlineEdit } from "@/components/okr/KRInlineEdit";
import { InlineCheckin } from "@/components/okr/InlineCheckin";
import {
  isCheckinOverdue,
  getCheckinDaysRemaining,
} from "@/lib/okr-logic";
import type { OKR, OKRStatus, OKRCategory } from "@/types";

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
  onUpdateKR,
}: OKRAccordionItemProps) {
  const score = (okr.progress / 100).toFixed(2);
  const statusColor = getStatusColor(okr.status);
  const cat = categoryConfig[okr.category];
  const statusCfg = statusBadgeConfig[okr.status];
  const overdue = isCheckinOverdue(okr.next_checkin_at);
  const daysRemaining = getCheckinDaysRemaining(okr.next_checkin_at);
  const CatIcon = cat.icon;

  return (
    <div
      className={`card overflow-hidden transition-shadow ${
        isExpanded ? "ring-1 ring-cream-300" : ""
      }`}
    >
      {/* ===== Always Visible Card ===== */}
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
            className={`h-4 w-4 text-cream-300 flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:text-muted ${
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

        {/* Row 3: Key Results */}
        {okr.key_results && okr.key_results.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {okr.key_results.map((kr) => (
              <div key={kr.id} className="flex items-center gap-3">
                <span className="text-[13px] text-foreground truncate w-[40%] sm:w-[45%] flex-shrink-0">
                  {kr.title}
                </span>
                <ProgressBar
                  value={kr.progress}
                  size="xs"
                  color={statusColor}
                  className="flex-1 min-w-0"
                />
                <span className="text-[12px] text-muted tabular-nums whitespace-nowrap flex-shrink-0">
                  {kr.current_value} / {kr.target_value}
                  {kr.unit ? ` ${kr.unit}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Row 4: Footer — Check-in Button + Timer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-cream-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCheckin(okr);
            }}
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
        </div>
      </div>

      {/* ===== Expanded Content ===== */}
      {isExpanded && (
        <div
          id={`okr-detail-${okr.id}`}
          className="border-t border-cream-200 bg-cream-50/50 px-4 sm:px-5 py-4 space-y-4"
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

          {/* Editable Key Results */}
          {okr.key_results && okr.key_results.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Key Results bearbeiten
              </h4>
              <div className="space-y-2">
                {okr.key_results.map((kr) => (
                  <KRInlineEdit
                    key={kr.id}
                    kr={kr}
                    onUpdate={(krId, newValue) => {
                      onUpdateKR?.(okr.id, krId, newValue);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Check-in */}
          {onQuickCheckin && (
            <InlineCheckin
              okr={okr}
              onSubmit={(data) => onQuickCheckin(okr, data)}
            />
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
