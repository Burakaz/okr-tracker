"use client";

import { useState } from "react";
import { ChevronDown, Clock, TrendingUp, MessageSquare } from "lucide-react";
import { useCheckinHistory } from "@/lib/queries";
import type { CheckIn } from "@/types";

const confidenceEmojis: Record<number, string> = {
  1: "😰",
  2: "😟",
  3: "😐",
  4: "😊",
  5: "🟢",
};

const confidenceLabels: Record<number, string> = {
  1: "Sehr schwierig",
  2: "Schwierig",
  3: "Unsicher",
  4: "Machbar",
  5: "Läuft",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

function CheckinEntry({ checkin }: { checkin: CheckIn }) {
  const details = checkin.change_details as { previous_progress?: number; new_progress?: number } | undefined;
  const prevProgress = details?.previous_progress;
  const newProgress = details?.new_progress;
  const hasProgressChange = prevProgress != null && newProgress != null && prevProgress !== newProgress;
  const progressDelta = hasProgressChange ? newProgress! - prevProgress! : 0;

  return (
    <div className="relative pl-6 pb-4 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-3 bottom-0 w-px bg-cream-300 last:hidden" />
      {/* Timeline dot */}
      <div className="absolute left-0 top-[6px] w-[15px] h-[15px] rounded-full border-2 border-cream-300 bg-background flex items-center justify-center">
        <div className="w-[5px] h-[5px] rounded-full bg-cream-400" />
      </div>

      <div className="space-y-1">
        {/* Header: date + confidence */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(checkin.checked_at)}
          </span>
          {checkin.confidence && (
            <span className="text-[12px] flex items-center gap-1" title={confidenceLabels[checkin.confidence]}>
              <span>{confidenceEmojis[checkin.confidence]}</span>
              <span className="text-muted">{confidenceLabels[checkin.confidence]}</span>
            </span>
          )}
        </div>

        {/* Progress change */}
        {hasProgressChange && (
          <div className="flex items-center gap-1.5 text-[12px]">
            <TrendingUp className="h-3 w-3 text-muted" />
            <span className="text-muted">{Math.round(prevProgress!)}%</span>
            <span className="text-muted">→</span>
            <span className="font-medium text-foreground">{Math.round(newProgress!)}%</span>
            <span className={`text-[11px] font-medium ${progressDelta > 0 ? "text-[var(--status-success)]" : progressDelta < 0 ? "text-[var(--status-error)]" : "text-muted"}`}>
              ({progressDelta > 0 ? "+" : ""}{Math.round(progressDelta)}%)
            </span>
          </div>
        )}

        {/* Note */}
        {checkin.what_helped && (
          <div className="flex gap-1.5 text-[13px] text-foreground">
            <MessageSquare className="h-3 w-3 text-muted flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{checkin.what_helped}</p>
          </div>
        )}

        {/* Review badge placeholder — will be filled in Task 3 */}
        {(checkin as Record<string, unknown>).review && (
          <div className="text-[11px] text-muted italic">
            Manager-Feedback vorhanden
          </div>
        )}
      </div>
    </div>
  );
}

interface CheckinHistoryProps {
  okrId: string;
  maxVisible?: number;
  isManagerView?: boolean;
}

export function CheckinHistory({ okrId, maxVisible = 3, isManagerView = false }: CheckinHistoryProps) {
  const { data, isLoading } = useCheckinHistory(okrId);
  const [showAll, setShowAll] = useState(false);

  const checkins = data?.checkins || [];

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-cream-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock className="h-5 w-5 text-muted mx-auto mb-1.5" />
        <p className="text-[13px] text-muted">
          Noch keine Check-ins — mach dein erstes Update!
        </p>
      </div>
    );
  }

  const visible = showAll ? checkins : checkins.slice(0, maxVisible);
  const hasMore = checkins.length > maxVisible;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Check-in Verlauf ({checkins.length})
        </h4>
      </div>

      <div className="relative">
        {visible.map((checkin) => (
          <CheckinEntry key={checkin.id} checkin={checkin} />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-[12px] text-muted hover:text-foreground transition-colors mt-2 ml-6"
        >
          <ChevronDown className="h-3 w-3" />
          Alle {checkins.length} Check-ins anzeigen
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-1 text-[12px] text-muted hover:text-foreground transition-colors mt-2 ml-6"
        >
          <ChevronDown className="h-3 w-3 rotate-180" />
          Weniger anzeigen
        </button>
      )}
    </div>
  );
}
