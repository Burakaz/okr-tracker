"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Target,
  ArrowRight,
  Clock,
  Loader2,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useOKRs, useCurrentUser, useEnrollments, useMotivation } from "@/lib/queries";
import {
  getCurrentQuarter,
  isCheckinOverdue,
} from "@/lib/okr-logic";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InlineCheckin } from "@/components/dashboard/InlineCheckin";
import type { OKR } from "@/types";

const currentQuarter = getCurrentQuarter();

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: okrData, isLoading: isLoadingOKRs } = useOKRs(currentQuarter);
  const { data: enrollmentsData } = useEnrollments();

  const user = userData?.user;
  const okrs: OKR[] = okrData?.okrs || [];
  const enrollments = enrollmentsData?.enrollments || [];

  // Active OKRs
  const activeOKRs = useMemo(() => okrs.filter((o) => o.is_active), [okrs]);

  // Overdue check-ins
  const overdueOKRs = useMemo(
    () => activeOKRs.filter((o) => isCheckinOverdue(o.next_checkin_at)),
    [activeOKRs]
  );

  // Average progress
  const avgProgress = useMemo(() => {
    if (activeOKRs.length === 0) return 0;
    return Math.round(
      activeOKRs.reduce((sum, o) => sum + o.progress, 0) / activeOKRs.length
    );
  }, [activeOKRs]);

  // Days remaining in quarter
  const daysRemaining = useMemo(() => {
    const now = new Date();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    const endMonth = currentQ * 3;
    const quarterEnd = new Date(year, endMonth, 0);
    const diff = Math.ceil(
      (quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  }, []);

  // Learning stats
  const activeCourses = useMemo(
    () => enrollments.filter((e) => e.status === "in_progress"),
    [enrollments]
  );
  const completedModules = useMemo(
    () =>
      enrollments.reduce(
        (acc, e) => acc + (e.module_completions?.length ?? 0),
        0
      ),
    [enrollments]
  );
  const totalModules = useMemo(
    () =>
      enrollments.reduce(
        (acc, e) => acc + (e.course?.modules?.length ?? 0),
        0
      ),
    [enrollments]
  );

  // AI Motivation
  const firstName = user?.name?.split(" ")[0] || "du";
  const { data: motivationData, isLoading: isLoadingMotivation } = useMotivation({
    name: firstName,
    progress: avgProgress,
    okrCount: activeOKRs.length,
    overdueCount: overdueOKRs.length,
    daysRemaining,
  });

  if (isLoadingUser || isLoadingOKRs) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Guten Morgen" : hour < 17 ? "Hallo" : "Guten Abend";

  // Motivational emoji based on progress
  const motivEmoji =
    avgProgress >= 70 ? "🔥" : avgProgress >= 40 ? "💪" : overdueOKRs.length > 0 ? "⏰" : "🚀";

  // SVG Progress Ring
  const ringSize = 80;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgProgress / 100) * circumference;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
        {/* Motivational Greeting */}
        <div className="py-2 px-2">
          <h1 className="text-2xl sm:text-3xl text-foreground">
            {greeting}, <span className="font-playfair italic">{firstName}</span>! {motivEmoji}
          </h1>
          {activeOKRs.length > 0 ? (
            <div className="mt-2 flex items-start gap-2">
              {isLoadingMotivation ? (
                <p className="text-[13px] text-muted/70 animate-pulse">
                  Dein KI-Coach denkt nach...
                </p>
              ) : motivationData?.message ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[13px] text-muted leading-relaxed">
                    {motivationData.message}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted">
                  Du hast {activeOKRs.length} aktive Ziele mit {avgProgress}% Fortschritt.
                  {daysRemaining > 0 && ` Noch ${daysRemaining} Tage im Quartal.`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted mt-2">
              Starte ins Quartal und setze dir ambitionierte Ziele.
            </p>
          )}
        </div>

        {/* Quarter Hero */}
        <div className="card p-6">
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="flex-shrink-0 relative">
              <svg width={ringSize} height={ringSize} className="-rotate-90" role="img" aria-label={`Fortschritt: ${avgProgress}%`}>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-cream-200"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-accent-green transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">
                  {avgProgress}%
                </span>
              </div>
            </div>

            {/* Quarter Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">
                {currentQuarter}
              </h2>
              <p className="text-sm text-muted mt-0.5">
                {daysRemaining} Tage verbleibend
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted" />
                  <span className="text-[13px] text-foreground">
                    {activeOKRs.length} Ziele aktiv
                  </span>
                </div>
              </div>
              {/* Full-width progress bar */}
              <div className="mt-3">
                <ProgressBar value={avgProgress} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Inline Check-ins */}
        {overdueOKRs.length > 0 && (
          <InlineCheckin okrs={overdueOKRs} />
        )}

        {/* All up-to-date celebration */}
        {activeOKRs.length > 0 && overdueOKRs.length === 0 && (
          <div className="card p-4 border-l-4 border-l-accent-green bg-green-50/30">
            <p className="text-[13px] font-medium text-foreground">
              Alles aktuell! Deine Ziele sind auf dem neuesten Stand.
            </p>
          </div>
        )}

        {/* No OKRs state */}
        {activeOKRs.length === 0 && (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-muted" />
            </div>
            <p className="text-[14px] font-medium text-foreground mb-1">
              Noch keine Ziele für {currentQuarter}
            </p>
            <p className="text-[12px] text-muted mb-4">
              Erstelle dein erstes OKR und starte durch.
            </p>
            <Link href="/okrs" className="btn-primary text-[13px] gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Ziel erstellen
            </Link>
          </div>
        )}

        {/* Learning Progress */}
        {activeCourses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Lernfortschritt
              </h2>
              <Link
                href="/learnings"
                className="text-[12px] text-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                Alle Kurse
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[12px] text-muted">
                {activeCourses.length} aktive{" "}
                {activeCourses.length === 1 ? "Kurs" : "Kurse"} &middot;{" "}
                {completedModules}/{totalModules} Module
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCourses.slice(0, 4).map((enrollment) => {
                const course = enrollment.course;
                if (!course) return null;
                const modulesDone =
                  enrollment.module_completions?.length ?? 0;
                const modulesTotal = course.modules?.length ?? 0;
                const pct =
                  modulesTotal > 0
                    ? Math.round((modulesDone / modulesTotal) * 100)
                    : 0;

                return (
                  <Link key={enrollment.id} href="/learnings" className="card p-3 card-hover block">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-accent-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ProgressBar value={pct} size="sm" className="flex-1" />
                          <span className="text-[11px] text-muted flex-shrink-0">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <QuickStatCard
            icon={<Target className="h-4 w-4 text-accent-green" />}
            label="Aktive Ziele"
            value={activeOKRs.length}
          />
          <QuickStatCard
            icon={<CheckCircle2 className="h-4 w-4 text-accent-green" />}
            label="Durchschnitt"
            value={`${avgProgress}%`}
          />
          <QuickStatCard
            icon={<BookOpen className="h-4 w-4 text-muted" />}
            label="Aktive Kurse"
            value={activeCourses.length}
          />
          <QuickStatCard
            icon={<Clock className="h-4 w-4 text-muted" />}
            label="Tage übrig"
            value={daysRemaining}
          />
        </div>
      </div>
    </div>
  );
}

// ===== Sub-Components =====

function QuickStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card p-4 card-hover">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted mt-1">{label}</p>
    </div>
  );
}
