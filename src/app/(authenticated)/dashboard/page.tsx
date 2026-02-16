"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Users,
  AlertCircle,
  Target,
  Zap,
  GraduationCap,
  TrendingUp,
  Star,
  Lightbulb,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useOKRs, useCurrentUser, useCareerProgress } from "@/lib/queries";
import { getCurrentQuarter, isCheckinOverdue, getCategoryLabel, getCategoryClassName, progressToScore } from "@/lib/okr-logic";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { OKR, OKRCategory } from "@/types";

const currentQuarter = getCurrentQuarter();

const categoryConfig: Record<OKRCategory, { icon: typeof Target; color: string; bgColor: string }> = {
  performance: { icon: Target, color: "text-green-600", bgColor: "bg-green-50" },
  skill: { icon: Zap, color: "text-blue-600", bgColor: "bg-blue-50" },
  learning: { icon: GraduationCap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  career: { icon: TrendingUp, color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function DashboardPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: okrData, isLoading: isLoadingOKRs } = useOKRs(currentQuarter);
  const { data: careerData } = useCareerProgress();

  const user = userData?.user;
  const okrs: OKR[] = okrData?.okrs || [];
  const careerProgress = careerData?.progress || null;

  // Overdue check-ins
  const overdueOKRs = useMemo(() => {
    return okrs.filter((o) => o.is_active && isCheckinOverdue(o.next_checkin_at));
  }, [okrs]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const active = okrs.filter((o) => o.is_active);
    return {
      performance: active.filter((o) => o.category === "performance").length,
      skill: active.filter((o) => o.category === "skill").length,
      learning: active.filter((o) => o.category === "learning").length,
      career: active.filter((o) => o.category === "career").length,
    };
  }, [okrs]);

  // Top OKR (highest progress, active)
  const topOKR = useMemo(() => {
    const active = okrs.filter((o) => o.is_active);
    if (active.length === 0) return null;
    return active.reduce((best, current) =>
      current.progress > best.progress ? current : best
    );
  }, [okrs]);

  // Average progress
  const avgProgress = useMemo(() => {
    const active = okrs.filter((o) => o.is_active);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum, o) => sum + o.progress, 0) / active.length);
  }, [okrs]);

  if (isLoadingUser || isLoadingOKRs) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Hallo, {user?.name?.split(" ")[0] || "dort"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {currentQuarter} &middot; Dein persönliches Dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/okrs" className="btn-primary text-[13px] gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            OKR
          </Link>
          <Link href="/learnings" className="btn-secondary text-[13px] gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Kurs
          </Link>
          <Link href="/team" className="btn-ghost text-[13px] gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Team
          </Link>
        </div>

        {/* Overdue Check-ins */}
        {overdueOKRs.length > 0 && (
          <div className="card p-5 mb-8 border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold text-foreground">
                Diese Woche fällig
              </h2>
              <span className="badge badge-red text-[11px]">
                {overdueOKRs.length}
              </span>
            </div>
            <div className="space-y-2">
              {overdueOKRs.slice(0, 3).map((okr) => (
                <Link
                  key={okr.id}
                  href="/okrs"
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-[13px] text-foreground truncate">
                      {okr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${getCategoryClassName(okr.category)} text-[10px]`}>
                      {getCategoryLabel(okr.category)}
                    </span>
                    <span className="text-[12px] text-muted">
                      {okr.progress}%
                    </span>
                  </div>
                </Link>
              ))}
              {overdueOKRs.length > 3 && (
                <Link
                  href="/okrs"
                  className="text-[12px] text-muted hover:text-foreground transition-colors flex items-center gap-1 pt-1"
                >
                  +{overdueOKRs.length - 3} weitere
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Category Cards */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Kategorien
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(categoryConfig) as OKRCategory[]).map((cat) => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              const count = categoryCounts[cat];

              return (
                <Link
                  key={cat}
                  href={`/okrs?category=${cat}`}
                  className="card card-hover p-4 flex flex-col gap-3 group"
                >
                  <div className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4.5 w-4.5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                      {getCategoryLabel(cat)}
                    </p>
                    <p className="text-[12px] text-muted">
                      {count} {count === 1 ? "OKR" : "OKRs"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Empfehlungen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Top OKR */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Star className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-[11px] text-muted uppercase tracking-wider font-medium">
                  Top OKR
                </span>
              </div>
              {topOKR ? (
                <>
                  <p className="text-[13px] font-medium text-foreground mb-2 line-clamp-2">
                    {topOKR.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={topOKR.progress} size="sm" className="flex-1" />
                    <span className="text-[11px] font-medium text-muted">
                      {progressToScore(topOKR.progress)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-muted">
                  Noch keine aktiven OKRs
                </p>
              )}
            </div>

            {/* Course Recommendation */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[11px] text-muted uppercase tracking-wider font-medium">
                  Kursempfehlung
                </span>
              </div>
              <p className="text-[13px] font-medium text-foreground mb-1">
                Skill-Gaps schließen
              </p>
              <p className="text-[12px] text-muted mb-3">
                Basierend auf deinen OKR-Kategorien
              </p>
              <Link
                href="/learnings"
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Kurse entdecken
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Career Goal */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-[11px] text-muted uppercase tracking-wider font-medium">
                  Karriereziel
                </span>
              </div>
              {careerProgress ? (
                <>
                  <p className="text-[13px] font-medium text-foreground mb-1">
                    {careerProgress.qualifying_okr_count} qualifizierende OKRs
                  </p>
                  <p className="text-[12px] text-muted mb-3">
                    {careerProgress.total_okrs_attempted} insgesamt versucht
                  </p>
                  <Link
                    href="/career"
                    className="text-[12px] font-medium text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    Karrierepfad ansehen
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-medium text-foreground mb-1">
                    Karrierepfad starten
                  </p>
                  <p className="text-[12px] text-muted mb-3">
                    Setze OKRs und verfolge deinen Fortschritt
                  </p>
                  <Link
                    href="/career"
                    className="text-[12px] font-medium text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    Mehr erfahren
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quarter Overview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Quartalsüberblick
            </h2>
            <Link
              href="/okrs"
              className="text-[12px] text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              Alle OKRs
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {okrs.filter((o) => o.is_active).length}
              </p>
              <p className="text-[12px] text-muted">Aktive OKRs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {avgProgress}%
              </p>
              <p className="text-[12px] text-muted">Durchschnitt</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {okrs.filter((o) => o.is_focus).length}
              </p>
              <p className="text-[12px] text-muted">Im Fokus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
