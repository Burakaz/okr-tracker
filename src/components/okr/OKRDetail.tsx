"use client";

import {
  X,
  Pencil,
  ClipboardCheck,
  Archive,
  Copy,
  Trash2,
  Calendar,
  Target,
  MessageSquare,
  History,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceIndicator } from "@/components/ui/ConfidenceIndicator";
import type { OKR, CheckIn, AuditLog, OKRCategory } from "@/types";

interface OKRDetailProps {
  okr: OKR;
  checkins?: CheckIn[];
  auditLogs?: AuditLog[];
  onClose: () => void;
  onEdit: () => void;
  onCheckin: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const categoryConfig: Record<OKRCategory, { label: string; colorClass: string }> = {
  performance: { label: "Performance", colorClass: "badge-blue" },
  skill: { label: "Skill", colorClass: "badge-yellow" },
  learning: { label: "Learning", colorClass: "badge-green" },
  career: { label: "Karriere", colorClass: "badge-gray" },
};

export function OKRDetail({
  okr,
  checkins = [],
  auditLogs = [],
  onClose,
  onEdit,
  onCheckin,
  onArchive,
  onDuplicate,
  onDelete,
}: OKRDetailProps) {
  const score = okr.progress / 100;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-cream-300/50">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-foreground mb-2 leading-tight">
            {okr.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${categoryConfig[okr.category]?.colorClass || "badge-gray"}`}>
              {categoryConfig[okr.category]?.label}
            </span>
            <StatusBadge status={okr.status} />
            <ScoreBadge score={score} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Detailansicht schließen"
        >
          <X className="h-5 w-5 text-muted" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview Section */}
        <div className="p-6 space-y-5">
          {/* Why it matters */}
          {okr.why_it_matters && (
            <div>
              <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Warum ist das wichtig?
              </h3>
              <p className="text-[13px] text-foreground leading-relaxed bg-cream-50 rounded-lg p-3">
                {okr.why_it_matters}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-cream-50 rounded-lg p-3">
              <p className="text-[11px] text-muted mb-1">Quartal</p>
              <p className="text-[13px] font-medium text-foreground">{okr.quarter}</p>
            </div>
            <div className="bg-cream-50 rounded-lg p-3">
              <p className="text-[11px] text-muted mb-1">Fällig</p>
              <p className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted" />
                {okr.due_date
                  ? new Date(okr.due_date).toLocaleDateString("de-DE")
                  : "Kein Datum"}
              </p>
            </div>
            <div className="bg-cream-50 rounded-lg p-3">
              <p className="text-[11px] text-muted mb-1">Zuversicht</p>
              <ConfidenceIndicator level={okr.confidence} showLabel />
            </div>
            <div className="bg-cream-50 rounded-lg p-3">
              <p className="text-[11px] text-muted mb-1">Fortschritt</p>
              <ProgressBar value={okr.progress} showLabel />
            </div>
          </div>

          {/* Key Results Section */}
          <div>
            <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Key Results ({okr.key_results?.length || 0})
            </h3>
            <div className="space-y-2">
              {okr.key_results?.map((kr) => (
                <div
                  key={kr.id}
                  className="bg-cream-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium text-foreground flex-1 truncate pr-2">
                      {kr.title}
                    </p>
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {kr.current_value}{kr.unit ? ` ${kr.unit}` : ""} / {kr.target_value}{kr.unit ? ` ${kr.unit}` : ""}
                    </span>
                  </div>
                  <ProgressBar value={kr.progress} size="sm" />
                </div>
              ))}
              {(!okr.key_results || okr.key_results.length === 0) && (
                <p className="text-[13px] text-muted italic">Keine Key Results definiert.</p>
              )}
            </div>
          </div>

          {/* Check-in History Section */}
          {checkins.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Check-in Verlauf ({checkins.length})
              </h3>
              <div className="space-y-3">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="border-l-2 border-cream-300 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-muted">
                        {new Date(checkin.checked_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {checkin.confidence && (
                        <ConfidenceIndicator level={checkin.confidence} size="sm" />
                      )}
                    </div>
                    {checkin.what_helped && (
                      <p className="text-[12px] text-foreground mb-0.5">
                        <span className="text-accent-green font-medium">+</span> {checkin.what_helped}
                      </p>
                    )}
                    {checkin.what_blocked && (
                      <p className="text-[12px] text-foreground mb-0.5">
                        <span className="text-red-500 font-medium">-</span> {checkin.what_blocked}
                      </p>
                    )}
                    {checkin.next_steps && (
                      <p className="text-[12px] text-muted">
                        &rarr; {checkin.next_steps}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Section */}
          {auditLogs.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Änderungsverlauf
              </h3>
              <div className="space-y-1.5">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-muted">
                      {new Date(log.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-foreground">{formatAuditAction(log.action)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-cream-300/50">
        <button onClick={onEdit} className="btn-secondary text-[13px] gap-1.5 py-1.5 flex-1">
          <Pencil className="h-3.5 w-3.5" />
          Bearbeiten
        </button>
        <button onClick={onCheckin} className="btn-success text-[13px] gap-1.5 py-1.5 flex-1">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Check-in
        </button>
        <button
          onClick={onArchive}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
          title="Archivieren"
          aria-label="OKR archivieren"
        >
          <Archive className="h-4 w-4 text-muted" aria-hidden="true" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
          title="Duplizieren"
          aria-label="OKR duplizieren"
        >
          <Copy className="h-4 w-4 text-muted" aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Löschen"
          aria-label="OKR löschen"
        >
          <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function formatAuditAction(action: string): string {
  const actionLabels: Record<string, string> = {
    okr_create: "OKR erstellt",
    okr_update: "OKR aktualisiert",
    okr_delete: "OKR gelöscht",
    okr_archive: "OKR archiviert",
    okr_restore: "OKR wiederhergestellt",
    okr_duplicate: "OKR dupliziert",
    kr_update: "Key Result aktualisiert",
    checkin_create: "Check-in durchgeführt",
    focus_toggle: "Fokus geändert",
    career_level_up: "Level aufgestiegen",
  };
  return actionLabels[action] || action;
}
