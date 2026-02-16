"use client";

import Link from "next/link";
import {
  Settings,
  TrendingUp,
  Award,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCurrentUser, useCareerProgress } from "@/lib/queries";
import { CareerLadder } from "@/components/career/CareerLadder";
import { ProgressOverview } from "@/components/career/ProgressOverview";

// Placeholder data for current/next level (career_paths API is WIP)
const PLACEHOLDER_CURRENT_LEVEL = {
  id: "junior",
  name: "Junior",
  sortOrder: 2,
};

const PLACEHOLDER_NEXT_LEVEL = {
  id: "midlevel",
  name: "Midlevel",
  sortOrder: 3,
};

export default function CareerPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: careerData, isLoading: isLoadingCareer } = useCareerProgress();

  const user = userData?.user ?? null;
  const progress = careerData?.progress ?? null;

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
      <div className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">Career</h1>
          <p className="text-[11px] text-muted">
            Dein Weg zum nachsten Level
          </p>
        </div>
        <Link href="/settings" className="btn-ghost text-[13px] gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          Einstellungen
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
                    {PLACEHOLDER_CURRENT_LEVEL.name}
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-muted">
                {user?.department
                  ? `${user.department} - ${user.name}`
                  : user?.name ?? "Nicht festgelegt"}
              </p>
            </div>

            {/* Next Step */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-muted" />
                </div>
                <div>
                  <p className="text-[11px] text-muted uppercase tracking-wider">
                    Nachster Schritt
                  </p>
                  <p className="text-[17px] font-semibold text-foreground">
                    {PLACEHOLDER_NEXT_LEVEL.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted">
                <span>Anforderungen ansehen</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <ProgressOverview
            progress={progress}
            isLoading={isLoadingCareer}
          />

          {/* Career Path Ladder */}
          <div>
            <h2 className="text-[15px] font-semibold text-foreground mb-4">
              Karrierepfad
            </h2>
            <CareerLadder currentLevelId={PLACEHOLDER_CURRENT_LEVEL.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
