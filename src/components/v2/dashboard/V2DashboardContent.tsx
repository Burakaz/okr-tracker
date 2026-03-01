"use client";

import { useMemo } from "react";
import { Target, Plus } from "lucide-react";
import Link from "next/link";
import { useOKRs, useEnrollments } from "@/lib/queries";
import {
  getCurrentQuarter,
  getQuarterDateRange,
  isCheckinOverdue,
} from "@/lib/okr-logic";
import { PageTransition } from "../motion/PageTransition";
import { StaggerChildren, StaggerItem } from "../motion/StaggerChildren";
import { QuarterHero } from "./QuarterHero";
import { InlineStats } from "./InlineStats";
import { CheckinNudge } from "./CheckinNudge";
import { FocusOKRRow } from "./FocusOKRRow";
import { LearningProgressRow } from "./LearningProgressRow";
import { V2SkeletonDashboard } from "../ui/V2Skeleton";

export function V2DashboardContent() {
  const currentQuarter = getCurrentQuarter();
  const { data: okrData, isLoading: okrLoading } = useOKRs(currentQuarter);
  const { data: enrollmentsData, isLoading: enrollLoading } = useEnrollments();

  const {
    activeOKRs,
    focusOKRs,
    overdueOKRs,
    avgProgress,
    daysRemaining,
    activeCourses,
  } = useMemo(() => {
    const okrs = okrData?.okrs ?? [];
    const enrollments = enrollmentsData?.enrollments ?? [];

    const active = okrs.filter((o) => o.is_active);
    const focus = active.filter((o) => o.is_focus).slice(0, 3);
    const overdue = active.filter((o) => isCheckinOverdue(o.next_checkin_at));

    const avg =
      active.length > 0
        ? Math.round(active.reduce((sum, o) => sum + o.progress, 0) / active.length)
        : 0;

    const { end } = getQuarterDateRange(currentQuarter);
    const now = new Date();
    const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const courses = enrollments.filter((e) => e.status === "in_progress");

    return {
      activeOKRs: active,
      focusOKRs: focus,
      overdueOKRs: overdue,
      avgProgress: avg,
      daysRemaining: days,
      activeCourses: courses,
    };
  }, [okrData, enrollmentsData, currentQuarter]);

  if (okrLoading || enrollLoading) {
    return <V2SkeletonDashboard />;
  }

  return (
    <PageTransition className="h-full overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
        <StaggerChildren className="space-y-6">
          {/* Quarter Hero */}
          <StaggerItem>
            <QuarterHero
              quarter={currentQuarter}
              daysRemaining={daysRemaining}
              avgProgress={avgProgress}
            />
          </StaggerItem>

          {/* Inline Stats */}
          <StaggerItem>
            <InlineStats
              activeCount={activeOKRs.length}
              avgProgress={avgProgress}
              activeCourses={activeCourses.length}
              daysRemaining={daysRemaining}
            />
          </StaggerItem>

          {/* Check-in Nudge */}
          <StaggerItem>
            <CheckinNudge overdueOKRs={overdueOKRs} />
          </StaggerItem>

          {/* Focus OKRs */}
          <StaggerItem>
            {activeOKRs.length > 0 ? (
              <div className="space-y-2">
                <p className="v2-section-label px-3">Focus</p>
                <div className="space-y-0.5">
                  {(focusOKRs.length > 0 ? focusOKRs : activeOKRs.slice(0, 3)).map((okr) => (
                    <FocusOKRRow key={okr.id} okr={okr} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--v2-bg-active)] flex items-center justify-center mb-3">
                  <Target className="h-5 w-5 text-[var(--v2-text-3)]" />
                </div>
                <p className="text-[14px] font-medium text-[var(--v2-text)] mb-1">
                  Keine Ziele vorhanden
                </p>
                <p className="text-[12px] text-[var(--v2-text-3)] mb-4">
                  Erstelle dein erstes Quartalsziel
                </p>
                <Link
                  href="/v2/okrs"
                  className="v2-btn v2-btn-primary text-[12px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ziel erstellen
                </Link>
              </div>
            )}
          </StaggerItem>

          {/* Learning Progress */}
          {activeCourses.length > 0 && (
            <StaggerItem>
              <div className="space-y-2">
                <p className="v2-section-label px-3">Lernfortschritt</p>
                <div className="space-y-0.5">
                  {activeCourses.slice(0, 4).map((enrollment) => (
                    <LearningProgressRow key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            </StaggerItem>
          )}
        </StaggerChildren>
      </div>
    </PageTransition>
  );
}
