"use client";

import { BookOpen } from "lucide-react";
import { CourseCard } from "./CourseCard";
import type { Course, Enrollment } from "@/types";

interface CourseCatalogProps {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;
  onViewDetail: (id: string) => void;
  onEnroll: (id: string) => void;
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      {/* Gradient placeholder */}
      <div className="h-[100px] bg-cream-200 animate-pulse rounded-t-[1rem]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-cream-200 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-cream-200 animate-pulse rounded w-full" />
        <div className="h-3 bg-cream-200 animate-pulse rounded w-2/3" />
        <div className="flex items-center gap-3 mt-2">
          <div className="h-3 bg-cream-200 animate-pulse rounded w-20" />
          <div className="h-3 bg-cream-200 animate-pulse rounded w-16" />
        </div>
        <div className="h-8 bg-cream-200 animate-pulse rounded mt-3" />
      </div>
    </div>
  );
}

export function CourseCatalog({
  courses,
  enrollments,
  isLoading,
  onViewDetail,
  onEnroll,
}: CourseCatalogProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-muted" aria-hidden="true" />
        </div>
        <p className="empty-state-title">Keine Kurse gefunden</p>
        <p className="empty-state-description">
          Versuche andere Filter oder erstelle einen neuen Kurs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map((course) => {
        const enrollment = enrollments.find(
          (e) => e.course_id === course.id
        );
        return (
          <CourseCard
            key={course.id}
            course={course}
            enrollment={enrollment}
            onViewDetail={onViewDetail}
            onEnroll={onEnroll}
          />
        );
      })}
    </div>
  );
}
