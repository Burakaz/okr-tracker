"use client";

import {
  Palette,
  Code,
  Megaphone,
  Crown,
  BarChart3,
  MessageSquare,
  Package,
  Lightbulb,
  Clock,
} from "lucide-react";
import type { Course, Enrollment, CourseCategory } from "@/types";

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  onViewDetail: (id: string) => void;
  onEnroll?: (id: string) => void;
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

const categoryIcons: Record<CourseCategory, React.ReactNode> = {
  design: <Palette className="h-8 w-8 text-white/90" />,
  development: <Code className="h-8 w-8 text-white/90" />,
  marketing: <Megaphone className="h-8 w-8 text-white/90" />,
  leadership: <Crown className="h-8 w-8 text-white/90" />,
  data: <BarChart3 className="h-8 w-8 text-white/90" />,
  communication: <MessageSquare className="h-8 w-8 text-white/90" />,
  product: <Package className="h-8 w-8 text-white/90" />,
  other: <Lightbulb className="h-8 w-8 text-white/90" />,
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

export function CourseCard({
  course,
  enrollment,
  onViewDetail,
  onEnroll,
}: CourseCardProps) {
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === "completed";
  const progress = enrollment?.progress ?? 0;

  const totalModules = course.modules?.length ?? 0;
  const completedModules = enrollment?.module_completions?.length ?? 0;

  // SVG progress ring calculations
  const ringSize = 40;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="card card-hover cursor-pointer overflow-hidden flex flex-col"
      onClick={() => onViewDetail(course.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetail(course.id);
        }
      }}
      aria-label={`Kurs: ${course.title}`}
    >
      {/* Gradient header */}
      <div
        className={`course-gradient bg-gradient-to-r ${categoryGradients[course.category]}`}
      >
        {/* Category badge top-left */}
        <span className="absolute top-2.5 left-2.5 badge bg-white/20 text-white text-[10px] backdrop-blur-sm">
          {categoryLabels[course.category]}
        </span>

        {/* Difficulty badge top-right */}
        <span
          className={`absolute top-2.5 right-2.5 badge ${difficultyBadgeClass[course.difficulty] ?? "badge-gray"} text-[10px]`}
        >
          {difficultyLabels[course.difficulty] ?? course.difficulty}
        </span>

        {/* Category icon centered */}
        {categoryIcons[course.category]}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-[14px] font-medium text-foreground mb-1 line-clamp-1">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-[12px] text-muted line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-muted mb-3">
          {course.provider && (
            <span className="truncate">{course.provider}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDuration(course.estimated_duration_minutes)}
          </span>
        </div>

        {/* Progress section for enrolled courses */}
        {isEnrolled && (
          <div className="flex items-center gap-3 mb-3">
            <svg
              width={ringSize}
              height={ringSize}
              className="progress-ring flex-shrink-0"
            >
              {/* Background circle */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="var(--cream-200)"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                className="progress-ring__circle"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div>
              <span className="text-[13px] font-semibold text-foreground">
                {Math.round(progress)}%
              </span>
              <p className="text-[11px] text-muted">
                {completedModules}/{totalModules} Module
              </p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        <div className="mt-2">
          {isCompleted ? (
            <button
              className="w-full py-1.5 px-3 text-[12px] font-medium rounded-lg bg-green-50 text-green-600 cursor-default"
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              Abgeschlossen
            </button>
          ) : isEnrolled ? (
            <button
              className="btn-primary w-full text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(course.id);
              }}
            >
              Fortsetzen
            </button>
          ) : (
            <button
              className="btn-secondary w-full text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onEnroll?.(course.id);
              }}
            >
              Einschreiben
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
