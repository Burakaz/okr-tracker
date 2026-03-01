"use client";

import { useState, useMemo, Suspense } from "react";
import {
  TrendingUp,
  Target,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { getCategoryLabel, getCategoryClassName } from "@/lib/okr-logic";
import type { ReviewData, OKRStatus, AchievementType } from "@/types";

// ===== Achievement display mapping =====
const ACHIEVEMENT_DISPLAY: Record<AchievementType, { icon: string; label: string }> = {
  first_okr: { icon: "\uD83C\uDFAF", label: "Erster Meilenstein" },
  first_checkin: { icon: "\u2705", label: "Erster Check-in" },
  first_course_completed: { icon: "\uD83C\uDF93", label: "Erster Kurs" },
  streak_3w: { icon: "\uD83D\uDD25", label: "3-Wochen-Streak" },
  streak_8w: { icon: "\uD83D\uDD25", label: "8-Wochen-Streak" },
  quarter_hero: { icon: "\uD83C\uDFC6", label: "Quartalsheld" },
  learning_machine: { icon: "\uD83D\uDCDA", label: "Lernmaschine" },
  all_completed: { icon: "\u2B50", label: "Alle Ziele erreicht" },
};

// ===== Hook =====
function useReview(quarter: string) {
  return useQuery<{ review: ReviewData }>({
    queryKey: ["review", quarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (quarter) params.set("quarter", quarter);
      const res = await fetch(`/api/review?${params}`);
      if (!res.ok) throw new Error("Fehler beim Laden des R\u00FCckblicks");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ===== Quarter helpers =====
function getPreviousQuarter(quarter: string): string {
  const match = quarter.match(/^Q([1-4]) (\d{4})$/);
  if (!match) return quarter;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  if (q === 1) return `Q4 ${year - 1}`;
  return `Q${q - 1} ${year}`;
}

function getDefaultReviewQuarter(): string {
  const now = new Date();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  if (currentQ === 1) return `Q4 ${currentYear - 1}`;
  return `Q${currentQ - 1} ${currentYear}`;
}

function getLast4QuartersForSelector(): string[] {
  const quarters: string[] = [];
  let current = getDefaultReviewQuarter();
  for (let i = 0; i < 4; i++) {
    quarters.push(current);
    current = getPreviousQuarter(current);
  }
  return quarters.reverse();
}

// ===== Status icon helper =====
function StatusIcon({ status }: { status: OKRStatus }) {
  switch (status) {
    case "on_track":
      return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />;
    case "at_risk":
      return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true" />;
    case "off_track":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" aria-hidden="true" />;
  }
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const availableQuarters = useMemo(() => getLast4QuartersForSelector(), []);
  const [selectedQuarter, setSelectedQuarter] = useState(
    availableQuarters[availableQuarters.length - 1]
  );

  const { data, isLoading } = useReview(selectedQuarter);
  const review = data?.review;

  // Quarter navigation
  const currentIndex = availableQuarters.indexOf(selectedQuarter);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < availableQuarters.length - 1;

  const handlePrev = () => {
    if (canGoBack) setSelectedQuarter(availableQuarters[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoForward) setSelectedQuarter(availableQuarters[currentIndex + 1]);
  };

  // Derived counts
  const statusCounts = useMemo(() => {
    if (!review) return { on_track: 0, at_risk: 0, off_track: 0 };
    return {
      on_track: review.okrs.filter((o) => o.status === "on_track").length,
      at_risk: review.okrs.filter((o) => o.status === "at_risk").length,
      off_track: review.okrs.filter((o) => o.status === "off_track").length,
    };
  }, [review]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">R&uuml;ckblick</h1>
        </div>
        <div className="card p-4 sm:p-6 animate-pulse">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-16 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
          {/* 1. Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">R&uuml;ckblick</h1>
          </div>

          {/* 2. Quarter Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoBack}
              className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Vorheriges Quartal"
            >
              <ChevronLeft className="h-4 w-4 text-muted" aria-hidden="true" />
            </button>

            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-cream-100 text-foreground border-0 cursor-pointer focus:ring-2 focus:ring-accent-green"
              aria-label="Quartal ausw&auml;hlen"
            >
              {availableQuarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={!canGoForward}
              className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="N&auml;chstes Quartal"
            >
              <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
            </button>
          </div>

          {/* Empty state */}
          {!review || review.okrs.length === 0 ? (
            <div className="empty-state" role="status">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted" aria-hidden="true" />
              </div>
              <p className="empty-state-title">
                Keine OKRs f&uuml;r {selectedQuarter}
              </p>
              <p className="empty-state-description">
                F&uuml;r dieses Quartal liegen keine Daten vor.
              </p>
            </div>
          ) : (
            <>
              {/* a) QuarterScoreCard */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-muted" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Quartal-Score
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-4">
                  <p
                    className={`text-4xl font-bold ${
                      review.score >= 70
                        ? "text-green-600"
                        : review.score >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {review.score}%
                  </p>
                  <p className="text-sm text-muted">
                    {review.okrs.length} OKR{review.okrs.length !== 1 ? "s" : ""} gesamt
                  </p>
                </div>

                {/* Status bar segments */}
                <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-cream-200">
                  {statusCounts.on_track > 0 && (
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${(statusCounts.on_track / review.okrs.length) * 100}%`,
                      }}
                      title={`Im Plan: ${statusCounts.on_track}`}
                    />
                  )}
                  {statusCounts.at_risk > 0 && (
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${(statusCounts.at_risk / review.okrs.length) * 100}%`,
                      }}
                      title={`Gef\u00E4hrdet: ${statusCounts.at_risk}`}
                    />
                  )}
                  {statusCounts.off_track > 0 && (
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${(statusCounts.off_track / review.okrs.length) * 100}%`,
                      }}
                      title={`Kritisch: ${statusCounts.off_track}`}
                    />
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Im Plan ({statusCounts.on_track})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Gef&auml;hrdet ({statusCounts.at_risk})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Kritisch ({statusCounts.off_track})
                  </span>
                </div>
              </div>

              {/* b) Highlights list */}
              <div>
                <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  OKR-&Uuml;bersicht
                </h2>
                <div className="space-y-2">
                  {review.okrs.map((okr) => (
                    <div
                      key={okr.id}
                      className="card p-4 flex items-center gap-3"
                    >
                      <StatusIcon status={okr.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {okr.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`badge ${getCategoryClassName(okr.category)}`}
                          >
                            {getCategoryLabel(okr.category)}
                          </span>
                          <span className="text-[11px] text-muted">
                            {okr.key_results_count} Key Result
                            {okr.key_results_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ProgressBar
                          value={okr.progress}
                          size="sm"
                          showLabel
                          className="w-28"
                        />
                        <StatusBadge status={okr.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* c) Learning summary */}
              <div>
                <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  Lern&uuml;bersicht
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-4">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Eingeschrieben
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {review.learning_summary.courses_enrolled}
                    </p>
                    <p className="text-[11px] text-muted mt-1">Kurse</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Abgeschlossen
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {review.learning_summary.courses_completed}
                    </p>
                    <p className="text-[11px] text-muted mt-1">Kurse</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Zertifikate
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {review.learning_summary.certificates_earned}
                    </p>
                    <p className="text-[11px] text-muted mt-1">Erhalten</p>
                  </div>
                </div>
              </div>

              {/* d) Trend sparkline (bar chart) */}
              {review.trend.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    Trend
                  </h2>
                  <div className="card p-4">
                    <div className="flex items-end gap-3 h-32">
                      {review.trend.map((t) => {
                        const maxScore = Math.max(
                          ...review.trend.map((tr) => tr.score),
                          1
                        );
                        const heightPct = (t.score / maxScore) * 100;
                        const barColor =
                          t.score >= 70
                            ? "bg-green-500"
                            : t.score >= 40
                              ? "bg-amber-500"
                              : "bg-red-400";

                        return (
                          <div
                            key={t.quarter}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[11px] font-medium text-foreground">
                              {t.score}%
                            </span>
                            <div className="w-full flex items-end h-20">
                              <div
                                className={`w-full ${barColor} rounded-t-md transition-all duration-300`}
                                style={{
                                  height: `${Math.max(heightPct, 4)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted whitespace-nowrap">
                              {t.quarter}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* e) Achievement badges */}
              {review.achievements.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    Erfolge
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {review.achievements.map((achievement) => {
                      const display =
                        ACHIEVEMENT_DISPLAY[
                          achievement.type as AchievementType
                        ] || {
                          icon: "\uD83C\uDFC5",
                          label: achievement.type,
                        };
                      return (
                        <div
                          key={achievement.id}
                          className="card p-4 flex flex-col items-center text-center"
                        >
                          <span className="text-3xl mb-2" role="img" aria-label={display.label}>
                            {display.icon}
                          </span>
                          <p className="text-[12px] font-semibold text-foreground">
                            {display.label}
                          </p>
                          <p className="text-[10px] text-muted mt-1">
                            {new Date(achievement.earned_at).toLocaleDateString(
                              "de-DE",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
