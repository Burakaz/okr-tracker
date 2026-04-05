"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  Clock,
  ExternalLink,
  Palette,
  Code,
  Megaphone,
  TrendingUp,
  Settings2,
  Users,
  DollarSign,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCourse } from "@/lib/queries";
import { categoryGradients, categoryLabels } from "@/lib/category-styles";
import { ModuleChecklist } from "./ModuleChecklist";
import { CertificateUpload } from "./CertificateUpload";
import type { CourseCategory } from "@/types";

interface CourseDetailModalProps {
  courseId: string;
  onClose: () => void;
  onEnroll: (courseId: string) => void;
  onUnenroll: (enrollmentId: string) => void;
}

const VALID_CATEGORIES = ["design", "development", "marketing", "sales", "operations", "hr", "finance", "other"];

const categoryIcons: Record<string, React.ReactNode> = {
  design: <Palette className="h-5 w-5" />,
  development: <Code className="h-5 w-5" />,
  marketing: <Megaphone className="h-5 w-5" />,
  sales: <TrendingUp className="h-5 w-5" />,
  operations: <Settings2 className="h-5 w-5" />,
  hr: <Users className="h-5 w-5" />,
  finance: <DollarSign className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

const difficultyLabels: Record<string, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

const difficultyBadgeClass: Record<string, string> = {
  beginner: "badge-green",
  intermediate: "badge-yellow",
  advanced: "badge-red",
};

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours} Std. ${remaining} Min.` : `${hours} Std.`;
  }
  return `${minutes} Min.`;
}

export function CourseDetailModal({
  courseId,
  onClose,
  onEnroll,
  onUnenroll,
}: CourseDetailModalProps) {
  const focusTrapRef = useFocusTrap();
  const { data, isLoading } = useCourse(courseId);
  const course = data?.course;
  const enrollment = data?.enrollment;

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isEnrolled = !!enrollment;
  const showCertificateUpload =
    isEnrolled &&
    (enrollment.status === "completed" || enrollment.status === "in_progress");

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-detail-title"
    >
      <div
        ref={focusTrapRef}
        className="modal-content-wide"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !course ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : (
          <>
            {/* Gradient header */}
            <div
              className={`relative h-[60px] bg-gradient-to-r ${categoryGradients[VALID_CATEGORIES.includes(course.category) ? course.category : "other"]} rounded-t-[1rem]`}
            >
              {/* Category badge */}
              {(() => {
                const displayCategory = VALID_CATEGORIES.includes(course.category) ? course.category : "other";
                return (
                  <span className="absolute top-3 left-4 badge bg-white/30 text-white text-[10px] flex items-center gap-1">
                    {categoryIcons[displayCategory]}
                    {categoryLabels[displayCategory]}
                  </span>
                );
              })()}

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-4 p-1 bg-white/30 hover:bg-white/40 rounded-lg transition-colors"
                aria-label="Schliessen"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Title */}
            <div className="px-6 pt-4 pb-2">
              <h2
                id="course-detail-title"
                className="text-lg font-semibold text-foreground"
              >
                {course.title}
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-5">
              {/* 1. Description */}
              {course.description && (
                <p className="text-[13px] text-foreground leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* 2. Meta info */}
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
                {course.provider && (
                  <span className="badge badge-gray">{course.provider}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDuration(course.estimated_duration_minutes)}
                </span>
                <span
                  className={`badge ${difficultyBadgeClass[course.difficulty] ?? "badge-gray"}`}
                >
                  {difficultyLabels[course.difficulty] ?? course.difficulty}
                </span>
                {course.external_url && (
                  <a
                    href={course.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Kursseite
                  </a>
                )}
              </div>

              {/* 3. Module Checklist */}
              {course.modules && course.modules.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                    Module ({course.modules.length})
                  </h3>
                  <ModuleChecklist
                    modules={course.modules}
                    completions={enrollment?.module_completions ?? []}
                    enrollmentId={enrollment?.id}
                    courseId={course.id}
                    readOnly={!isEnrolled}
                  />
                </div>
              )}

              {/* 4. Certificate Upload */}
              {showCertificateUpload && (
                <div>
                  <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                    Zertifikate
                  </h3>
                  <CertificateUpload
                    enrollmentId={enrollment.id}
                    certificates={enrollment.certificates ?? []}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cream-300/50">
              {isEnrolled ? (
                <button
                  className="btn-ghost text-red-500 text-[13px]"
                  onClick={() => onUnenroll(enrollment.id)}
                >
                  Abmelden
                </button>
              ) : (
                <button
                  className="btn-primary text-[13px]"
                  onClick={() => onEnroll(course.id)}
                >
                  Einschreiben
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
