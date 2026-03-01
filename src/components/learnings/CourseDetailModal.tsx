"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  Clock,
  ExternalLink,
  Palette,
  Code,
  Megaphone,
  Crown,
  BarChart3,
  MessageSquare,
  Package,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useCourse } from "@/lib/queries";
import { ModuleChecklist } from "./ModuleChecklist";
import { CertificateUpload } from "./CertificateUpload";
import type { CourseCategory } from "@/types";

interface CourseDetailModalProps {
  courseId: string;
  onClose: () => void;
  onEnroll: (courseId: string) => void;
  onUnenroll: (enrollmentId: string) => void;
}

const categoryGradients: Record<CourseCategory, string> = {
  design: "from-pink-400 to-purple-500",
  development: "from-cyan-400 to-blue-500",
  marketing: "from-orange-400 to-red-500",
  leadership: "from-amber-400 to-yellow-600",
  data: "from-emerald-400 to-teal-500",
  communication: "from-violet-400 to-indigo-500",
  product: "from-rose-400 to-pink-500",
  other: "from-gray-400 to-slate-500",
};

const categoryLabels: Record<CourseCategory, string> = {
  design: "Design",
  development: "Entwicklung",
  marketing: "Marketing",
  leadership: "Leadership",
  data: "Daten",
  communication: "Kommunikation",
  product: "Produkt",
  other: "Sonstiges",
};

const categoryIcons: Record<CourseCategory, React.ReactNode> = {
  design: <Palette className="h-5 w-5" />,
  development: <Code className="h-5 w-5" />,
  marketing: <Megaphone className="h-5 w-5" />,
  leadership: <Crown className="h-5 w-5" />,
  data: <BarChart3 className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  product: <Package className="h-5 w-5" />,
  other: <Lightbulb className="h-5 w-5" />,
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
              className={`relative h-[60px] bg-gradient-to-r ${categoryGradients[course.category]} rounded-t-[1rem]`}
            >
              {/* Category badge */}
              <span className="absolute top-3 left-4 badge bg-white/20 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
                {categoryIcons[course.category]}
                {categoryLabels[course.category]}
              </span>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-4 p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
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
