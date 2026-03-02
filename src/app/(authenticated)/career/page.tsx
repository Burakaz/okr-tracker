"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  TrendingUp,
  Award,
  ArrowRight,
  Loader2,
  BarChart3,
  Lightbulb,
  Palette,
  FolderKanban,
  Clapperboard,
  Film,
  Handshake,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { useCurrentUser, useCareerProgress } from "@/lib/queries";
import { CareerLadder } from "@/components/career/CareerLadder";
import { ProgressOverview } from "@/components/career/ProgressOverview";
import {
  CAREER_PATHS,
  getCareerPath,
  getNextLevel,
  type CareerPath,
} from "@/lib/career-paths";

// Map icon string names to Lucide components
const ICON_MAP: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
  FolderKanban: <FolderKanban className="h-5 w-5" />,
  Clapperboard: <Clapperboard className="h-5 w-5" />,
  Film: <Film className="h-5 w-5" />,
  Handshake: <Handshake className="h-5 w-5" />,
};

const ICON_MAP_SM: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
  FolderKanban: <FolderKanban className="h-4 w-4" />,
  Clapperboard: <Clapperboard className="h-4 w-4" />,
  Film: <Film className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
};

export default function CareerPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: careerData, isLoading: isLoadingCareer } = useCareerProgress();

  const user = userData?.user ?? null;
  const progress = careerData?.progress ?? null;

  // Career path selection state
  const [selectedPathId, setSelectedPathId] = useState<string>(
    CAREER_PATHS[0].id
  );
  const [currentLevelId, setCurrentLevelId] = useState<string>("trainee");
  const [showPathSelector, setShowPathSelector] = useState(false);

  const selectedPath = getCareerPath(selectedPathId);
  const currentLevel = selectedPath?.levels.find(
    (l) => l.id === currentLevelId
  );
  const nextLevel = selectedPath
    ? getNextLevel(selectedPathId, currentLevelId)
    : undefined;

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
          {/* Career Path Selector */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent-green" />
                <h2 className="text-[13px] font-semibold text-foreground">
                  Dein Karrierepfad
                </h2>
              </div>
            </div>

            {/* Selected path display / dropdown trigger */}
            <button
              onClick={() => setShowPathSelector(!showPathSelector)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-cream-50 border border-cream-300/50 hover:border-accent-green/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-accent-greenLight flex items-center justify-center text-accent-green flex-shrink-0">
                {selectedPath && ICON_MAP[selectedPath.icon]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">
                  {selectedPath?.name}
                </p>
                <p className="text-[11px] text-muted truncate">
                  {selectedPath?.description}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted transition-transform ${showPathSelector ? "rotate-180" : ""}`}
              />
            </button>

            {/* Path options grid */}
            {showPathSelector && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {CAREER_PATHS.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => {
                      setSelectedPathId(path.id);
                      setCurrentLevelId("trainee");
                      setShowPathSelector(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedPathId === path.id
                        ? "border-accent-green bg-accent-greenLight/30"
                        : "border-cream-300/50 hover:border-accent-green/30 bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedPathId === path.id
                          ? "bg-accent-green text-white"
                          : "bg-cream-200 text-muted"
                      }`}
                    >
                      {ICON_MAP_SM[path.icon]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">
                        {path.shortName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Current level selector */}
            {selectedPath && (
              <div className="mt-4">
                <p className="text-[11px] text-muted uppercase tracking-wider mb-2">
                  Deine aktuelle Stufe
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPath.levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCurrentLevelId(level.id)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                        currentLevelId === level.id
                          ? "bg-accent-green text-white"
                          : "bg-cream-100 text-muted hover:bg-cream-200"
                      }`}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top cards row: Current Position + Next Step */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Position */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-greenLight flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <p className="text-[11px] text-muted uppercase tracking-wider">
                    Aktuelle Position
                  </p>
                  <p className="text-[17px] font-semibold text-foreground">
                    {currentLevel?.name ?? "Nicht festgelegt"}
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-muted">
                {selectedPath?.shortName}
                {user?.department ? ` · ${user.department}` : ""}
              </p>
              {currentLevel && (
                <p className="text-[11px] text-muted mt-1">
                  {currentLevel.experience} Berufserfahrung
                </p>
              )}
            </div>

            {/* Next Step */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-muted" />
                </div>
                <div>
                  <p className="text-[11px] text-muted uppercase tracking-wider">
                    Nächster Schritt
                  </p>
                  <p className="text-[17px] font-semibold text-foreground">
                    {nextLevel?.name ?? "Höchste Stufe erreicht"}
                  </p>
                </div>
              </div>
              {nextLevel ? (
                <>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted">
                    <span>
                      {nextLevel.requirements.length} Anforderungen ·{" "}
                      {nextLevel.experience}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-accent-green mt-1.5 cursor-pointer hover:underline">
                    <span>Anforderungen ansehen</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-muted">
                  Gratulation! Du hast die höchste Stufe in diesem Pfad
                  erreicht.
                </p>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <ProgressOverview progress={progress} isLoading={isLoadingCareer} />

          {/* Career Path Ladder */}
          {selectedPath && (
            <div>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                {selectedPath.shortName} — Karrierepfad
              </h2>
              <CareerLadder
                levels={selectedPath.levels}
                currentLevelId={currentLevelId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
