"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Target, BookOpen, User, Loader2 } from "lucide-react";
import { useTeamMemberDetail, useCurrentUser } from "@/lib/queries";
import { getCurrentQuarter } from "@/lib/okr-logic";
import { getCareerPath, getNextLevel } from "@/lib/career-paths";
import { QuarterSelector } from "@/components/okr/QuarterSelector";
import { MemberDetailHeader } from "@/components/team/MemberDetailHeader";
import { MemberOKRSection } from "@/components/team/MemberOKRSection";
import { MemberLearningSection } from "@/components/team/MemberLearningSection";
import { MemberEnrollmentFilters } from "@/components/team/MemberEnrollmentFilters";
import { MemberProfileSection } from "@/components/team/MemberProfileSection";
import { CareerProgressCard } from "@/components/okr/CareerProgressCard";
import type { CareerLevel } from "@/types";

type TabId = "okrs" | "learning" | "profile";

const categoryLabels: Record<string, string> = {
  design: "Design",
  development: "Development",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  hr: "HR",
  finance: "Finanzen",
  other: "Sonstiges",
};

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>("okrs");
  const [currentQuarter, setCurrentQuarter] = useState(getCurrentQuarter());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch member with quarter-dependent OKR data
  const { data, isLoading, error } = useTeamMemberDetail(memberId, currentQuarter);
  const { data: userData } = useCurrentUser();

  const member = data?.member;
  const currentUser = userData?.user;

  // Permission check
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    if (["hr", "admin", "super_admin"].includes(currentUser.role)) return true;
    if (currentUser.role === "manager") return true;
    return false;
  }, [currentUser]);

  // Resolve next career level
  const nextLevel = useMemo((): CareerLevel | null => {
    if (!member?.craft_focus || !member?.career_level) return null;
    const pathData = getCareerPath(member.craft_focus);
    if (!pathData) return null;
    const currentLevelData = pathData.levels.find(
      (l) => l.name === member.career_level?.name || l.id === member.career_level?.name?.toLowerCase()
    );
    if (!currentLevelData) return null;
    const nextLevelData = getNextLevel(member.craft_focus, currentLevelData.id);
    if (!nextLevelData || !member.career_level) return null;
    return {
      ...member.career_level,
      id: nextLevelData.id,
      name: nextLevelData.name,
      sort_order: member.career_level.sort_order + 1,
    };
  }, [member]);

  // Client-side enrollment filtering
  const allEnrollments = useMemo(() => {
    if (!member?.enrollments) return [];
    return member.enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      progress: e.progress,
      started_at: e.started_at,
      completed_at: e.completed_at,
      course: e.course ? { id: e.course.id, title: e.course.title, category: e.course.category } : null,
    }));
  }, [member?.enrollments]);

  const enrollmentCounts = useMemo(() => ({
    all: allEnrollments.length,
    in_progress: allEnrollments.filter((e) => e.status === "in_progress").length,
    completed: allEnrollments.filter((e) => e.status === "completed").length,
    paused: allEnrollments.filter((e) => e.status === "paused").length,
    dropped: allEnrollments.filter((e) => e.status === "dropped").length,
  }), [allEnrollments]);

  const enrollmentCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    allEnrollments.forEach((e) => {
      const cat = e.course?.category;
      if (cat) catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries())
      .map(([key, count]) => ({
        key,
        label: categoryLabels[key] || key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allEnrollments]);

  const filteredEnrollments = useMemo(() => {
    let result = allEnrollments;
    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (categoryFilter) {
      result = result.filter((e) => e.course?.category === categoryFilter);
    }
    return result;
  }, [allEnrollments, statusFilter, categoryFilter]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-foreground font-medium mb-1">Mitglied nicht gefunden</p>
          <p className="text-[12px] text-muted">Das Profil konnte nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: typeof Target }> = [
    { id: "okrs", label: "OKRs", icon: Target },
    { id: "learning", label: "Lernen", icon: BookOpen },
    { id: "profile", label: "Profil & Karriere", icon: User },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-4">
          {/* Header */}
          <MemberDetailHeader
            name={member.name}
            email={member.email}
            avatarUrl={member.avatar_url}
            role={member.role}
            position={member.position}
            department={member.department}
            craftFocus={member.craft_focus}
            careerLevelName={member.career_level?.name || null}
            createdAt={member.created_at}
          />

          {/* Tab navigation */}
          <div className="flex items-center gap-1 border-b border-cream-300/50 pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Tab: OKRs ─── */}
          {activeTab === "okrs" && (
            <div className="space-y-4">
              {/* Quarter selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">
                  OKRs — {currentQuarter}
                </h3>
                <QuarterSelector
                  currentQuarter={currentQuarter}
                  onChange={setCurrentQuarter}
                />
              </div>

              <MemberOKRSection
                okrs={member.okrs || []}
                showSummary
                showHeader={false}
              />
            </div>
          )}

          {/* ─── Tab: Learning ─── */}
          {activeTab === "learning" && (
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-foreground">
                Lernfortschritte
              </h3>

              <MemberEnrollmentFilters
                counts={enrollmentCounts}
                categories={enrollmentCategories}
                statusFilter={statusFilter}
                categoryFilter={categoryFilter}
                onStatusChange={setStatusFilter}
                onCategoryChange={setCategoryFilter}
              />

              <MemberLearningSection
                enrollments={filteredEnrollments}
                showHeader={false}
              />
            </div>
          )}

          {/* ─── Tab: Profile & Career ─── */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4">
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

              <CareerProgressCard
                currentLevel={member.career_level}
                nextLevel={nextLevel}
                progress={member.career_progress}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
