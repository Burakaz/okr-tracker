"use client";

import Link from "next/link";
import {
  Settings,
  TrendingUp,
  Award,
  Loader2,
  Check,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useCurrentUser, useCareerProgress, useRequirementCompletions } from "@/lib/queries";
import { CareerLadder } from "@/components/career/CareerLadder";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CAREER_PATHS,
  getCareerPath,
  getNextLevel,
} from "@/lib/career-paths";

export default function CareerPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: careerData, isLoading: isLoadingCareer } = useCareerProgress();
  const { data: completionsData } = useRequirementCompletions();

  const user = userData?.user ?? null;
  const progress = careerData?.progress ?? null;
  const completions = completionsData?.completions ?? [];

  // Career path & level from user profile / backend (fallback to defaults)
  const userPathId = user?.craft_focus || CAREER_PATHS[0].id;
  const selectedPath = getCareerPath(userPathId) || CAREER_PATHS[0];

  // Current level from backend progress or user profile
  const currentLevelId = progress?.current_level_id || "junior";
  const currentLevel = selectedPath.levels.find(
    (l) => l.id === currentLevelId
  );
  const nextLevel = getNextLevel(selectedPath.id, currentLevelId);

  // Progress calculations — count ALL items (requirements + skills + responsibilities)
  const nextLevelTotalItems = nextLevel
    ? nextLevel.requirements.length +
      nextLevel.aiIntegration.length +
      (nextLevel.skills?.length ?? 0) +
      nextLevel.responsibilities.length
    : 0;
  const qualifyingOkrs = progress?.qualifying_okr_count ?? 1;
  const requiredOkrs = 4;
  const fulfilledItems = nextLevel
    ? completions.filter(
        (c) =>
          c.career_path_id === selectedPath.id &&
          c.level_id === nextLevel.id &&
          c.status === "completed"
      ).length
    : 0;
  const openItems = nextLevelTotalItems - fulfilledItems;
  const progressPercent =
    nextLevelTotalItems > 0
      ? Math.round((fulfilledItems / nextLevelTotalItems) * 100)
      : 0;

  const isLoading = isLoadingUser || isLoadingCareer;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-cream-300/50">
        <div className="h-14 flex items-center justify-between px-6 max-w-5xl mx-auto">
          <div>
            <h1 className="text-[15px] font-semibold text-foreground">
              Karriere
            </h1>
            <p className="text-[11px] text-muted">
              Dein Weg zum nächsten Level
            </p>
          </div>
          <Link href="/settings" className="btn-ghost text-[13px] gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Einstellungen
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Level Overview — Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bestätigtes Level */}
            <div className="card p-5">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                Bestätigtes Level
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                  <Award className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {currentLevel?.name ?? "Nicht festgelegt"}{" "}
                    {selectedPath.shortName}
                  </p>
                  <p className="text-[11px] text-muted">
                    {selectedPath.shortName}
                    {user?.department ? ` · ${user.department}` : ""}
                  </p>
                </div>
                {currentLevel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-200 text-foreground text-[11px] font-semibold">
                    <Check className="h-3 w-3" />
                    {currentLevel.id.charAt(0).toUpperCase() +
                      currentLevel.id.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Nächster Schritt */}
            <div className="card p-5">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                Nächster Schritt
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {nextLevel?.name ?? "Höchste Stufe erreicht"}{" "}
                    {nextLevel ? selectedPath.shortName : ""}
                  </p>
                  {nextLevel && (
                    <p className="text-[11px] text-muted">
                      {nextLevel.requirements.length +
                        nextLevel.aiIntegration.length +
                        (nextLevel.skills?.length ?? 0) +
                        nextLevel.responsibilities.length}{" "}
                      Kriterien · {nextLevel.experience}
                    </p>
                  )}
                </div>
                {nextLevel && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cream-200 text-foreground text-[11px] font-semibold">
                    {nextLevel.id.charAt(0).toUpperCase() +
                      nextLevel.id.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-foreground">
                Fortschritt zum nächsten Level
              </h2>
              <span className="text-[13px] font-semibold text-foreground">
                {progressPercent}%
              </span>
            </div>
            <ProgressBar value={progressPercent} size="md" />

            <p className="text-[12px] text-muted mt-3">
              {fulfilledItems} von {nextLevelTotalItems} Kriterien erfüllt ·{" "}
              {openItems} noch offen
            </p>

            {/* OKR qualification */}
            <div className="mt-4 pt-4 border-t border-cream-200/60">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-3.5 w-3.5 text-muted" />
                <span className="text-[12px] text-muted">
                  {qualifyingOkrs} von {requiredOkrs} OKRs mit Score ≥ 0.7
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: requiredOkrs }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-medium ${
                      i < qualifyingOkrs
                        ? "bg-foreground text-white"
                        : "bg-cream-200 text-muted"
                    }`}
                  >
                    {i < qualifyingOkrs ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Career Path Ladder */}
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
              Karrierepfad
            </p>
            <CareerLadder
              levels={selectedPath.levels}
              currentLevelId={currentLevelId}
              pathId={selectedPath.id}
              pathName={selectedPath.shortName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
