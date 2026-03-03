"use client";

import { BookOpen } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface MemberEnrollment {
  id: string;
  status: string;
  progress: number;
  course?: {
    id: string;
    title: string;
    category: string;
    [key: string]: unknown;
  } | null;
}

interface MemberLearningSectionProps {
  enrollments: MemberEnrollment[];
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

export function MemberLearningSection({ enrollments }: MemberLearningSectionProps) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-4">
        <BookOpen className="h-5 w-5 text-muted mx-auto mb-1" />
        <p className="text-[12px] text-muted">Keine Kurse eingeschrieben</p>
      </div>
    );
  }

  const completed = enrollments.filter((e) => e.status === "completed");
  const inProgress = enrollments.filter((e) => e.status === "in_progress");

  return (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Lernfortschritte ({enrollments.length})
      </h4>

      {/* Stats summary */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-muted">
          <span className="font-medium text-accent-green">{completed.length}</span> abgeschlossen
        </span>
        <span className="text-muted">
          <span className="font-medium text-foreground">{inProgress.length}</span> in Bearbeitung
        </span>
      </div>

      {enrollments.map((enrollment) => {
        const course = enrollment.course;
        if (!course) return null;

        return (
          <div key={enrollment.id} className="rounded-lg border border-cream-300/50 bg-cream-50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[13px] font-medium text-foreground flex-1 truncate">
                {course.title}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-muted font-medium flex-shrink-0">
                {categoryLabels[course.category] || course.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={enrollment.progress} size="sm" />
              </div>
              <span className="text-[11px] font-medium text-foreground tabular-nums">
                {Math.round(enrollment.progress)}%
              </span>
            </div>

            {enrollment.status === "completed" && (
              <p className="text-[10px] text-accent-green font-medium mt-1">Abgeschlossen</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
