"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { CourseCatalog } from "@/components/learnings/CourseCatalog";
import { MyLearnings } from "@/components/learnings/MyLearnings";
import { LearningFilters } from "@/components/learnings/LearningFilters";
import { CourseDetailModal } from "@/components/learnings/CourseDetailModal";
import { AddLearningForm } from "@/components/learnings/AddLearningForm";
import { TeamLearnings } from "@/components/learnings/TeamLearnings";
import {
  useCourses,
  useEnrollments,
  useEnrollCourse,
  useUnenroll,
  useCurrentUser,
  useSuggestCourses,
} from "@/lib/queries";
import type { UserRole } from "@/types";

export default function LearningsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <LearningsContent />
    </Suspense>
  );
}

type LearningTab = "my-learnings" | "catalog" | "team";

const MANAGER_ROLES: UserRole[] = ["manager", "hr", "admin", "super_admin"];

function LearningsContent() {
  const { data: userData } = useCurrentUser();
  const user = userData?.user || null;
  const isManager = user ? MANAGER_ROLES.includes(user.role) : false;

  // Tab & filter state
  const [activeTab, setActiveTab] = useState<LearningTab>("my-learnings");
  const [filters, setFilters] = useState<{
    category?: string;
    status?: string;
    search?: string;
  }>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Data fetching
  const catalogFilters = useMemo(
    () => ({
      category: filters.category,
      search: filters.search,
    }),
    [filters.category, filters.search]
  );

  const { data: coursesData, isLoading: isLoadingCourses } =
    useCourses(catalogFilters);
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } =
    useEnrollments(filters.status);

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];

  // Mutations
  const enrollMutation = useEnrollCourse();
  const unenrollMutation = useUnenroll();
  const suggestMutation = useSuggestCourses();

  // Handlers
  const handleEnroll = useCallback(
    async (courseId: string) => {
      try {
        await enrollMutation.mutateAsync(courseId);
        toast.success("Erfolgreich eingeschrieben!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Einschreiben"
        );
      }
    },
    [enrollMutation]
  );

  const handleViewDetail = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedCourseId(null);
  }, []);

  const handleUnenroll = useCallback(
    async (enrollmentId: string) => {
      try {
        await unenrollMutation.mutateAsync(enrollmentId);
        toast.success("Erfolgreich abgemeldet");
        setSelectedCourseId(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Abmelden"
        );
      }
    },
    [unenrollMutation]
  );

  const handleSuggest = useCallback(async () => {
    setShowAISuggestions(true);
    try {
      await suggestMutation.mutateAsync({
        goals: user?.craft_focus || undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler bei KI-Empfehlungen"
      );
    } finally {
      setShowAISuggestions(false);
    }
  }, [suggestMutation, user?.craft_focus]);

  const handleSwitchToCatalog = useCallback(() => {
    setActiveTab("catalog");
  }, []);

  // Filter courses by enrollment status for "my-learnings" tab
  const filteredEnrollments = useMemo(() => {
    let result = enrollments;

    if (filters.category) {
      result = result.filter(
        (e) => e.course?.category === filters.category
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.course?.title?.toLowerCase().includes(searchLower) ||
          e.course?.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [enrollments, filters.category, filters.search]);

  // Tab config
  const tabs = useMemo(() => {
    const base: { key: LearningTab; label: string; count?: number }[] = [
      { key: "my-learnings", label: "Meine Kurse", count: enrollments.length },
      { key: "catalog", label: "Kurskatalog", count: courses.length },
    ];
    if (isManager) {
      base.push({ key: "team", label: "Team" });
    }
    return base;
  }, [enrollments.length, courses.length, isManager]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* 1. Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Learning Hub
              </h1>
              <p className="text-[12px] text-muted mt-0.5">
                Dein Lern- und Entwicklungsprotokoll
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSuggest}
                disabled={showAISuggestions}
                className="btn-ghost text-[13px] gap-1.5"
              >
                {showAISuggestions ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                KI Vorschlagen
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary text-[13px] gap-1.5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Kurs hinzufügen
              </button>
            </div>
          </div>

          {/* 2. Tab navigation */}
          <div className="flex items-center gap-1 border-b border-cream-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-accent-green text-accent-green"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-[11px] opacity-70">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 3. Filters (not on team tab) */}
          {activeTab !== "team" && (
            <LearningFilters
              filters={filters}
              onFilterChange={setFilters}
              showStatusFilter={activeTab === "my-learnings"}
            />
          )}

          {/* 4. Tab content */}
          {activeTab === "my-learnings" && (
            <MyLearnings
              enrollments={filteredEnrollments}
              isLoading={isLoadingEnrollments}
              onViewDetail={handleViewDetail}
              onSwitchToCatalog={handleSwitchToCatalog}
            />
          )}

          {activeTab === "catalog" && (
            <CourseCatalog
              courses={courses}
              enrollments={enrollments}
              isLoading={isLoadingCourses}
              onViewDetail={handleViewDetail}
              onEnroll={handleEnroll}
            />
          )}

          {activeTab === "team" && isManager && <TeamLearnings />}
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <CourseDetailModal
          courseId={selectedCourseId}
          onClose={handleCloseDetail}
          onEnroll={handleEnroll}
          onUnenroll={handleUnenroll}
        />
      )}

      {/* Add Learning Form Modal */}
      {showAddForm && (
        <AddLearningForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
