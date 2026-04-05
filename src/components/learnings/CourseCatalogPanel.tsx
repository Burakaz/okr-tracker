"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Search,
  BookOpen,
  Clock,
  GraduationCap,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCourses, useEnrollments, useEnrollCourse } from "@/lib/queries";
import type { CourseCategory } from "@/types";

interface CourseCatalogPanelProps {
  open: boolean;
  onClose: () => void;
  onEnroll?: (courseId: string) => void;
}

const categoryFilters: { value: CourseCategory | "all"; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "design", label: "Design" },
  { value: "development", label: "Dev" },
  { value: "marketing", label: "Marketing" },
  { value: "leadership", label: "Leadership" },
  { value: "data", label: "Daten" },
  { value: "communication", label: "Komm." },
  { value: "product", label: "Produkt" },
  { value: "other", label: "Sonstige" },
];

const difficultyLabels: Record<string, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function CourseCatalogPanel({
  open,
  onClose,
  onEnroll: externalOnEnroll,
}: CourseCatalogPanelProps) {
  const focusTrapRef = useFocusTrap();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    CourseCategory | "all"
  >("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  // Focus search on open
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [open]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedSearch("");
      setActiveCategory("all");
    }
  }, [open]);

  // Fetch data
  const { data: coursesData, isLoading: coursesLoading } = useCourses({
    category: activeCategory === "all" ? undefined : activeCategory,
    search: debouncedSearch || undefined,
  });
  const { data: enrollmentsData } = useEnrollments();
  const enrollMutation = useEnrollCourse();

  const courses = coursesData?.courses ?? [];
  const enrollments = enrollmentsData?.enrollments ?? [];

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  function handleEnroll(courseId: string) {
    if (externalOnEnroll) {
      externalOnEnroll(courseId);
    } else {
      enrollMutation.mutate(courseId);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={focusTrapRef}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-xl z-50 flex flex-col slide-panel-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-300/50">
          <h2
            id="catalog-panel-title"
            className="text-[15px] font-semibold text-foreground flex items-center gap-2"
          >
            <GraduationCap
              className="h-4.5 w-4.5 text-blue-600"
              aria-hidden="true"
            />
            Kurskatalog
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
            aria-label="Kurskatalog schliessen"
          >
            <X className="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Kurs suchen..."
              className="input pl-8 pr-3 py-2 text-[13px]"
            />
          </div>
        </div>

        {/* Category filter pills */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categoryFilters.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`filter-pill ${
                  activeCategory === cat.value ? "active" : ""
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state py-12">
              <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center mb-3">
                <BookOpen
                  className="w-6 h-6 text-muted"
                  aria-hidden="true"
                />
              </div>
              <p className="empty-state-title text-[14px]">
                Keine Kurse gefunden
              </p>
              <p className="empty-state-description text-[12px]">
                Versuche andere Filter oder Suchbegriffe.
              </p>
            </div>
          ) : (
            courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const enrollment = enrollments.find(
                (e) => e.course_id === course.id
              );
              const totalModules = course.modules?.length ?? 0;

              return (
                <div
                  key={course.id}
                  className="card p-4 card-hover"
                >
                  {/* Title */}
                  <div className="flex items-start gap-2 mb-2">
                    <BookOpen
                      className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <h3 className="text-[13px] font-medium text-foreground line-clamp-1 flex-1">
                      {course.title}
                    </h3>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 text-[11px] text-muted mb-3 flex-wrap">
                    {course.provider && (
                      <span className="truncate max-w-[120px]">
                        {course.provider}
                      </span>
                    )}
                    <span className="text-cream-400">·</span>
                    <span>
                      {difficultyLabels[course.difficulty] ??
                        course.difficulty}
                    </span>
                    <span className="text-cream-400">·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock
                        className="h-3 w-3"
                        aria-hidden="true"
                      />
                      {formatDuration(
                        course.estimated_duration_minutes
                      )}
                    </span>
                    {totalModules > 0 && (
                      <>
                        <span className="text-cream-400">·</span>
                        <span>
                          {totalModules}{" "}
                          {totalModules === 1 ? "Modul" : "Module"}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action */}
                  {isEnrolled ? (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-green-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-green-600 font-medium">
                        Bereits eingeschrieben
                      </span>
                      {enrollment && (
                        <span className="text-muted ml-1">
                          ({Math.round(enrollment.progress)}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollMutation.isPending}
                      className="btn-secondary text-[12px] py-1.5 px-3"
                    >
                      {enrollMutation.isPending ? (
                        <Loader2
                          className="h-3 w-3 animate-spin"
                          aria-hidden="true"
                        />
                      ) : null}
                      Einschreiben
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </>
  );
}
