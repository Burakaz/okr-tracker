"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { toast } from "sonner";
import {
  Plus, Sparkles, Loader2, X, BookOpen,
  ChevronDown, ChevronRight, Search, ArrowDown,
} from "lucide-react";
import { CourseCard } from "@/components/learnings/CourseCard";
import { CategoryTiles } from "@/components/learnings/CategoryTiles";
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

const MANAGER_ROLES: UserRole[] = ["manager", "hr", "admin", "super_admin"];

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  development: "Entwicklung",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  hr: "HR",
  finance: "Finanzen",
  other: "Sonstige",
};

function LearningsContent() {
  const { data: userData } = useCurrentUser();
  const user = userData?.user || null;
  const isManager = user ? MANAGER_ROLES.includes(user.role) : false;

  // State
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTeamSection, setShowTeamSection] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [addFormState, setAddFormState] = useState<{
    open: boolean;
    initialTitle?: string;
    initialCategory?: CourseCategory;
  }>({ open: false });
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Data fetching
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses();
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useEnrollments();

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];

  // Derived data
  const activeEnrollments = enrollments.filter(e => e.status === "in_progress");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (selectedCategory && c.category !== selectedCategory) return false;
      if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [courses, selectedCategory, searchTerm]);

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
        "design", "development", "marketing", "sales",
        "operations", "hr", "finance", "other",
      ];
      const cat = validCategories.includes(category as CourseCategory)
        ? (category as CourseCategory)
        : "other";
      setAddFormState({ open: true, initialTitle: title, initialCategory: cat });
    },
    []
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-8 max-w-[1400px] mx-auto">
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
                onClick={() => setAddFormState({ open: true })}
                className="btn-primary text-[13px] gap-1.5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Kurs</span> hinzufuegen
              </button>
            </div>
          </div>

          {/* 2. AI Suggestions Panel */}
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

          {/* 3. Dein Lernfortschritt Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[15px] font-semibold text-foreground">
                Dein Lernfortschritt
              </h2>
              {activeEnrollments.length > 0 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-cream-200 text-muted">
                  {activeEnrollments.length}
                </span>
              )}
            </div>

            {isLoadingEnrollments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="h-[100px] bg-cream-200 animate-pulse rounded-t-[1rem]" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-cream-200 animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-cream-200 animate-pulse rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeEnrollments.map((enrollment) => {
                  if (!enrollment.course) return null;
                  return (
                    <CourseCard
                      key={enrollment.id}
                      course={enrollment.course}
                      enrollment={enrollment}
                      onViewDetail={handleViewDetail}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" role="status">
                <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted" aria-hidden="true" />
                </div>
                <p className="empty-state-title">
                  Noch keine Kurse
                </p>
                <p className="empty-state-description mb-3">
                  Entdecke den Katalog unten
                </p>
                <ArrowDown className="h-5 w-5 text-muted animate-pulse" aria-hidden="true" />
              </div>
            )}

            {/* Completed subsection */}
            {completedEnrollments.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors"
                >
                  {showCompleted ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Abgeschlossen ({completedEnrollments.length})
                </button>
                {showCompleted && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
                    {completedEnrollments.map((enrollment) => {
                      if (!enrollment.course) return null;
                      return (
                        <CourseCard
                          key={enrollment.id}
                          course={enrollment.course}
                          enrollment={enrollment}
                          onViewDetail={handleViewDetail}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 4. Entdecken / Kurskatalog Section */}
          <section>
            <h2 className="text-[15px] font-semibold text-foreground mb-4">
              Kurskatalog
            </h2>

            <div className="space-y-4">
              <CategoryTiles
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Kurse durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl border border-cream-300 bg-white placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
                />
              </div>

              {/* Course grid */}
              {isLoadingCourses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card overflow-hidden">
                      <div className="h-[100px] bg-cream-200 animate-pulse rounded-t-[1rem]" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-cream-200 animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-cream-200 animate-pulse rounded w-full" />
                        <div className="h-3 bg-cream-200 animate-pulse rounded w-2/3" />
                        <div className="h-8 bg-cream-200 animate-pulse rounded mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="empty-state" role="status">
                  <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted" aria-hidden="true" />
                  </div>
                  <p className="empty-state-title">Keine Kurse gefunden</p>
                  <p className="empty-state-description">
                    Versuche andere Filter oder erstelle einen neuen Kurs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => {
                    const enrollment = enrollments.find(
                      (e) => e.course_id === course.id
                    );
                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        enrollment={enrollment}
                        onViewDetail={handleViewDetail}
                        onEnroll={handleEnroll}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 5. Team Lernen Section (manager+ only) */}
          {isManager && (
            <section>
              <button
                onClick={() => setShowTeamSection(!showTeamSection)}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground hover:text-foreground/80 transition-colors"
              >
                {showTeamSection ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Team Lernfortschritt
              </button>
              {showTeamSection && (
                <div className="mt-4">
                  <TeamLearnings />
                </div>
              )}
            </section>
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
