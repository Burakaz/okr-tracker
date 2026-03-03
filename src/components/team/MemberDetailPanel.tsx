"use client";

import { Loader2 } from "lucide-react";
import { useTeamMemberDetail } from "@/lib/queries";
import { MemberProfileSection } from "./MemberProfileSection";
import { MemberOKRSection } from "./MemberOKRSection";
import { MemberLearningSection } from "./MemberLearningSection";
import { CareerProgressCard } from "@/components/okr/CareerProgressCard";
import { getCareerPath, getNextLevel } from "@/lib/career-paths";
import type { CareerLevel } from "@/types";

interface MemberDetailPanelProps {
  memberId: string;
  canEdit: boolean;
}

export function MemberDetailPanel({ memberId, canEdit }: MemberDetailPanelProps) {
  const { data, isLoading, error } = useTeamMemberDetail(memberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !data?.member) {
    return (
      <div className="text-center py-6">
        <p className="text-[12px] text-muted">
          Fehler beim Laden der Mitglieder-Details.
        </p>
      </div>
    );
  }

  const member = data.member;

  // Resolve next career level from career paths if possible
  let nextLevel: CareerLevel | null = null;
  if (member.craft_focus && member.career_level) {
    const pathData = getCareerPath(member.craft_focus);
    if (pathData) {
      // Find current level index in the path
      const currentLevelData = pathData.levels.find(
        (l) => l.name === member.career_level?.name || l.id === member.career_level?.name?.toLowerCase()
      );
      if (currentLevelData) {
        const nextLevelData = getNextLevel(member.craft_focus, currentLevelData.id);
        if (nextLevelData && member.career_level) {
          // Approximate a CareerLevel object for the next level
          nextLevel = {
            ...member.career_level,
            id: nextLevelData.id,
            name: nextLevelData.name,
            sort_order: member.career_level.sort_order + 1,
          };
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
      {/* Profile & Career (editable) */}
      <div className="rounded-lg border border-cream-300/50 bg-white p-4">
        <MemberProfileSection
          memberId={member.id}
          position={member.position}
          craftFocus={member.craft_focus}
          careerLevelId={member.career_level_id}
          department={member.department}
          careerLevel={member.career_level}
          canEdit={canEdit}
        />
      </div>

      {/* Career Progress */}
      <div>
        <CareerProgressCard
          currentLevel={member.career_level}
          nextLevel={nextLevel}
          progress={member.career_progress}
        />
      </div>

      {/* OKRs */}
      <div className="rounded-lg border border-cream-300/50 bg-white p-4">
        <MemberOKRSection okrs={member.okrs || []} />
      </div>

      {/* Learning */}
      <div className="rounded-lg border border-cream-300/50 bg-white p-4">
        <MemberLearningSection
          enrollments={(member.enrollments || []).map((e) => ({
            id: e.id,
            status: e.status,
            progress: e.progress,
            course: e.course ? { id: e.course.id, title: e.course.title, category: e.course.category } : null,
          }))}
        />
      </div>
    </div>
  );
}
