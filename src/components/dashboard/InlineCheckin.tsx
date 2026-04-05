"use client";

import { useState, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuickCheckin } from "@/lib/queries";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { OKR, ConfidenceLevel } from "@/types";

const categoryColors: Record<string, string> = {
  performance: "bg-blue-100 text-blue-700",
  skill: "bg-purple-100 text-purple-700",
  learning: "bg-green-100 text-green-700",
  career: "bg-amber-100 text-amber-700",
};

function daysOverdue(nextCheckinAt: string | null): number {
  if (!nextCheckinAt) return 0;
  const diff = Date.now() - new Date(nextCheckinAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ===== CheckinCard =====

function CheckinCard({
  okr,
  isExpanded,
  onToggle,
  onComplete,
}: {
  okr: OKR;
  isExpanded: boolean;
  onToggle: () => void;
  onComplete: (id: string) => void;
}) {
  const quickCheckin = useQuickCheckin();
  const [confidence, setConfidence] = useState<ConfidenceLevel>(okr.confidence);
  const [note, setNote] = useState("");
  const [krValues, setKrValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const kr of okr.key_results) {
      map[kr.id] = kr.current_value;
    }
    return map;
  });

  const overdue = daysOverdue(okr.next_checkin_at);
  const colorClass = categoryColors[okr.category] || categoryColors.performance;

  const handleSave = useCallback(() => {
    quickCheckin.mutate(
      {
        okrId: okr.id,
        confidence,
        note: note.trim() || undefined,
        key_result_updates: okr.key_results.map((kr) => ({
          id: kr.id,
          current_value: krValues[kr.id] ?? kr.current_value,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Check-in gespeichert!");
          onComplete(okr.id);
        },
        onError: (error) => {
          toast.error(error.message || "Fehler beim Speichern");
        },
      }
    );
  }, [quickCheckin, okr, confidence, note, krValues, onComplete]);

  return (
    <div className="card overflow-hidden">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-cream-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colorClass}`}>
              {okr.category}
            </span>
            {overdue > 0 && (
              <span className="text-[10px] text-amber-600 font-medium">
                {overdue}d überfällig
              </span>
            )}
          </div>
          <p className="text-[13px] font-medium text-foreground truncate">
            {okr.title}
          </p>
          <div className="mt-1.5">
            <ProgressBar value={okr.progress} size="sm" />
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted flex-shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded form */}
      {isExpanded && (
        <div className="border-t border-cream-200 p-4 space-y-4">
          {/* KR sliders */}
          {okr.key_results.map((kr) => (
            <div key={kr.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-foreground truncate flex-1 mr-2">
                  {kr.title}
                </span>
                <span className="text-[12px] font-medium text-foreground flex-shrink-0">
                  {krValues[kr.id] ?? kr.current_value}
                  {kr.unit ? ` ${kr.unit}` : ""} / {kr.target_value}
                  {kr.unit ? ` ${kr.unit}` : ""}
                </span>
              </div>
              <input
                type="range"
                min={kr.start_value}
                max={kr.target_value}
                value={krValues[kr.id] ?? kr.current_value}
                onChange={(e) =>
                  setKrValues((prev) => ({
                    ...prev,
                    [kr.id]: Number(e.target.value),
                  }))
                }
                className="w-full accent-accent-green"
              />
            </div>
          ))}

          {/* Confidence selector */}
          <div>
            <label className="text-[12px] text-muted mb-1.5 block">
              Zuversicht
            </label>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidence(level)}
                  className={`w-8 h-8 rounded text-[13px] font-medium transition-colors ${
                    confidence === level
                      ? "bg-foreground text-white"
                      : "bg-cream-100 text-muted hover:bg-cream-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[12px] text-muted mb-1.5 block">
              Notiz (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Was gibt es Neues?"
              className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-green/30 resize-none"
            />
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={quickCheckin.isPending}
            className="btn-primary w-full justify-center text-[13px]"
          >
            {quickCheckin.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Speichern"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== InlineCheckin (parent) =====

export function InlineCheckin({ okrs }: { okrs: OKR[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const visibleOKRs = okrs.filter((o) => !completedIds.has(o.id));

  const handleComplete = useCallback((id: string) => {
    setExpandedId(null);
    setCompletedIds((prev) => new Set(prev).add(id));
  }, []);

  if (visibleOKRs.length === 0) {
    return (
      <div className="card p-4 border-l-4 border-l-accent-green bg-green-50/30">
        <p className="text-[13px] font-medium text-foreground">
          Alles aktuell! Deine Ziele sind auf dem neuesten Stand.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          Deine offenen Updates
        </h2>
        <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
          {visibleOKRs.length}
        </span>
      </div>
      <div className="space-y-3">
        {visibleOKRs.map((okr) => (
          <CheckinCard
            key={okr.id}
            okr={okr}
            isExpanded={expandedId === okr.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === okr.id ? null : okr.id))
            }
            onComplete={handleComplete}
          />
        ))}
      </div>
    </div>
  );
}
