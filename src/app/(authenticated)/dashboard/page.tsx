"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Target,
  AlertCircle,
  ArrowRight,
  Clock,
  Loader2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { useOKRs, useCurrentUser, useEnrollments } from "@/lib/queries";
import {
  getCurrentQuarter,
  isCheckinOverdue,
} from "@/lib/okr-logic";
import { ProgressBar } from "@/components/ui/ProgressBar";
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

  if (isLoadingUser || isLoadingOKRs) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  // SVG Progress Ring
  const ringSize = 80;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgProgress / 100) * circumference;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
        {/* Quarter Hero */}
        <div className="card p-6">
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="flex-shrink-0 relative">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
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
              <h1 className="text-xl font-bold text-foreground">
                {currentQuarter}
              </h1>
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

        {/* Check-in Nudge */}
        {overdueOKRs.length > 0 && (
          <div className="card p-4 border-l-4 border-l-amber-400 bg-amber-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {overdueOKRs.length}{" "}
                    {overdueOKRs.length === 1 ? "Ziel braucht" : "Ziele brauchen"}{" "}
                    ein Update
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {overdueOKRs
                      .slice(0, 2)
                      .map((o) => o.title)
                      .join(", ")}
                    {overdueOKRs.length > 2 &&
                      ` +${overdueOKRs.length - 2} weitere`}
                  </p>
                </div>
              </div>
              <Link href="/okrs" className="btn-primary text-[12px] gap-1">
                <Clock className="h-3 w-3" />
                Check-in
              </Link>
            </div>
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
                href="/okrs"
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
                  <div key={enrollment.id} className="card p-3 card-hover">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-600" />
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickStatCard
            icon={<Target className="h-4 w-4 text-green-600" />}
            label="Aktive Ziele"
            value={activeOKRs.length}
          />
          <QuickStatCard
            icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />}
            label="Durchschnitt"
            value={`${avgProgress}%`}
          />
          <QuickStatCard
            icon={<BookOpen className="h-4 w-4 text-purple-600" />}
            label="Aktive Kurse"
            value={activeCourses.length}
          />
          <QuickStatCard
            icon={<Clock className="h-4 w-4 text-amber-600" />}
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
    <div className="card p-4">
      <div className="mb-1.5">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
