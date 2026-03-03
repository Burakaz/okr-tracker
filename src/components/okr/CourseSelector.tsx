"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, Check, Loader2 } from "lucide-react";
import { useCourses, useEnrollments } from "@/lib/queries";
import type { Course } from "@/types";

export interface SelectedCourse {
  courseId: string;
  title: string;
  moduleCount: number;
}

interface CourseSelectorProps {
  selected: SelectedCourse[];
  onSelectionChange: (courses: SelectedCourse[]) => void;
}

const categoryLabels: Record<string, string> = {
  design: "Design",
  development: "Development",
  marketing: "Marketing",
  leadership: "Leadership",
  data: "Data",
  communication: "Kommunikation",
  product: "Produkt",
  other: "Sonstiges",
};

export function CourseSelector({ selected, onSelectionChange }: CourseSelectorProps) {
  const [search, setSearch] = useState("");
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses();
  const { data: enrollmentsData } = useEnrollments();

  const courses = coursesData?.courses ?? [];
  const enrollments = enrollmentsData?.enrollments ?? [];

  // Build enrollment lookup
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, { id: string; progress: number }>();
    enrollments.forEach((e) => {
      map.set(e.course_id, { id: e.id, progress: e.progress });
    });
    return map;
  }, [enrollments]);

  // Filter courses by search
  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses.filter((c) => c.is_published);
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.is_published &&
        (c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q))
    );
  }, [courses, search]);

  const selectedIds = new Set(selected.map((s) => s.courseId));

  const toggleCourse = (course: Course) => {
    const moduleCount = course.modules?.length ?? 0;
    if (selectedIds.has(course.id)) {
      onSelectionChange(selected.filter((s) => s.courseId !== course.id));
    } else {
      onSelectionChange([
        ...selected,
        { courseId: course.id, title: course.title, moduleCount },
      ]);
    }
  };

  if (isLoadingCourses) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Kurse als Key Results
      </label>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kurs suchen..."
          className="input pl-9"
        />
      </div>

      {/* Course list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filteredCourses.length === 0 ? (
          <p className="text-[13px] text-muted text-center py-4">
            Keine Kurse gefunden.
          </p>
        ) : (
          filteredCourses.map((course) => {
            const isSelected = selectedIds.has(course.id);
            const enrollment = enrollmentMap.get(course.id);
            const moduleCount = course.modules?.length ?? 0;
            const duration = course.estimated_duration_minutes;
            const hours = Math.floor(duration / 60);
            const mins = duration % 60;
            const durationStr = hours > 0 ? `~${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `~${mins}m`;

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => toggleCourse(course)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  isSelected
                    ? "border-foreground/30 bg-cream-100"
                    : "border-cream-300/50 bg-cream-50 hover:bg-cream-100/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-foreground border-foreground"
                        : "border-cream-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted">
                        {moduleCount} Module · {durationStr}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-muted font-medium">
                        {categoryLabels[course.category] || course.category}
                      </span>
                    </div>
                    {enrollment && (
                      <p className="text-[11px] text-foreground/60 mt-0.5">
                        ✓ Eingeschrieben ({Math.round(enrollment.progress)}%)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selection count */}
      {selected.length > 0 && (
        <p className="text-[12px] text-muted mt-2">
          {selected.length} Kurs{selected.length !== 1 ? "e" : ""} ausgewählt
        </p>
      )}
    </div>
  );
}
