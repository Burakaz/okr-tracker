"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, Loader2, X } from "lucide-react";
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
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import type { UserRole, CourseCategory } from "@/types";

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

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  development: "Entwicklung",
  marketing: "Marketing",
  leadership: "Leadership",
  data: "Daten",
  communication: "Komm.",
  product: "Produkt",
  other: "Sonstige",
};

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
  const [addFormState, setAddFormState] = useState<{
    open: boolean;
    initialTitle?: string;
    initialCategory?: CourseCategory;
  }>({ open: false });
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
      setShowAISuggestions(false);
    }
  }, [suggestMutation, user?.craft_focus]);

  const handleDismissSuggestions = useCallback(() => {
    setShowAISuggestions(false);
    suggestMutation.reset();
  }, [suggestMutation]);

  const handleCreateFromSuggestion = useCallback(
    (title: string, category: string) => {
      const validCategories: CourseCategory[] = [
        "design",
        "development",
        "marketing",
        "leadership",
        "data",
        "communication",
        "product",
        "other",
      ];
      const cat = validCategories.includes(category as CourseCategory)
        ? (category as CourseCategory)
        : "other";
      setAddFormState({ open: true, initialTitle: title, initialCategory: cat });
    },
    []
  );

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
    const base: TabItem<LearningTab>[] = [
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
        <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
          {/* 1. Page header */}
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Learning Hub
              </h1>
              <p className="text-[12px] text-muted mt-0.5 hidden sm:block">
                Dein Lern- und Entwicklungsprotokoll
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSuggest}
                disabled={suggestMutation.isPending}
                className="btn-ghost text-[13px] gap-1.5"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">KI Vorschlagen</span>
              </button>
              <button
                onClick={() =>
                  setAddFormState({ open: true })
                }
                className="btn-primary text-[13px] gap-1.5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Kurs</span> hinzufuegen
              </button>
            </div>
          </div>

          {/* AI Suggestions Panel */}
          {showAISuggestions && (
            <div className="rounded-xl border border-accent-greenLight bg-accent-greenLight/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-green" aria-hidden="true" />
                  <span className="text-[13px] font-semibold text-foreground">
                    KI-Kursempfehlungen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDismissSuggestions}
                  className="p-1 hover:bg-cream-200 rounded-lg transition-colors"
                  aria-label="Empfehlungen schliessen"
                >
                  <X className="h-4 w-4 text-muted" aria-hidden="true" />
                </button>
              </div>

              {/* Loading */}
              {suggestMutation.isPending && (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-green flex-shrink-0" aria-hidden="true" />
                  <span className="text-[13px] text-muted">
                    KI generiert Kursempfehlungen...
                  </span>
                </div>
              )}

              {/* Error */}
              {suggestMutation.isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[13px] text-red-600 mb-2">
                    {suggestMutation.error?.message ||
                      "Fehler beim Laden der Empfehlungen"}
                  </p>
                  <button
                    type="button"
                    onClick={handleSuggest}
                    className="text-[12px] text-red-700 font-medium hover:text-red-800 transition-colors"
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}

              {/* Suggestions */}
              {suggestMutation.data &&
                suggestMutation.data.recommendations?.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestMutation.data.recommendations.map(
                      (rec: { title: string; category: string; reason: string }, index: number) => (
                        <div
                          key={`ai-rec-${index}`}
                          className="rounded-lg border border-cream-300/50 bg-white p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium text-foreground leading-snug">
                              {rec.title}
                            </p>
                            <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-cream-200 text-muted">
                              {CATEGORY_LABELS[rec.category] || rec.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            {rec.reason}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateFromSuggestion(rec.title, rec.category)
                            }
                            className="text-[11px] font-medium text-accent-green hover:text-accent-greenDark transition-colors flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Kurs erstellen
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          )}

          {/* 2. Tab navigation */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            ariaLabel="Lernbereiche"
          />

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
            <div role="tabpanel" id="panel-my-learnings" aria-labelledby="tab-my-learnings">
              <MyLearnings
                enrollments={filteredEnrollments}
                isLoading={isLoadingEnrollments}
                onViewDetail={handleViewDetail}
                onSwitchToCatalog={handleSwitchToCatalog}
              />
            </div>
          )}

          {activeTab === "catalog" && (
            <div role="tabpanel" id="panel-catalog" aria-labelledby="tab-catalog">
              <CourseCatalog
                courses={courses}
                enrollments={enrollments}
                isLoading={isLoadingCourses}
                onViewDetail={handleViewDetail}
                onEnroll={handleEnroll}
              />
            </div>
          )}

          {activeTab === "team" && isManager && (
            <div role="tabpanel" id="panel-team" aria-labelledby="tab-team">
              <TeamLearnings />
            </div>
          )}
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
      {addFormState.open && (
        <AddLearningForm
          onClose={() => setAddFormState({ open: false })}
          initialTitle={addFormState.initialTitle}
          initialCategory={addFormState.initialCategory}
        />
      )}
    </div>
  );
}
