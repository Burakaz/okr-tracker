"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Clock,
  Sparkles,
  GraduationCap,
  Target,
  Zap,
  TrendingUp,
  Loader2,
} from "lucide-react";
import type { OKRCategory } from "@/types";

interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  category: OKRCategory;
  provider: string;
}

const PLACEHOLDER_COURSES: Course[] = [
  {
    id: "1",
    name: "OKR Grundlagen Masterclass",
    description: "Lerne die Grundlagen der OKR-Methodik und wie du sie erfolgreich einsetzt.",
    duration: "4 Std.",
    category: "performance",
    provider: "Intern",
  },
  {
    id: "2",
    name: "Fortgeschrittene Kommunikation",
    description: "Verbessere deine Kommunikationsfähigkeiten für Meetings und Präsentationen.",
    duration: "6 Std.",
    category: "skill",
    provider: "LinkedIn Learning",
  },
  {
    id: "3",
    name: "Data Analytics Grundkurs",
    description: "Einführung in Datenanalyse mit praktischen Beispielen aus dem Marketing.",
    duration: "8 Std.",
    category: "learning",
    provider: "Coursera",
  },
  {
    id: "4",
    name: "Leadership & Management",
    description: "Führungskompetenzen entwickeln und Teams effektiv leiten.",
    duration: "10 Std.",
    category: "career",
    provider: "Intern",
  },
  {
    id: "5",
    name: "Agiles Projektmanagement",
    description: "Scrum, Kanban und agile Methoden in der Praxis anwenden.",
    duration: "5 Std.",
    category: "skill",
    provider: "Udemy",
  },
  {
    id: "6",
    name: "Performance Marketing Vertiefung",
    description: "Google Ads, Meta Ads und Conversion-Optimierung für Fortgeschrittene.",
    duration: "12 Std.",
    category: "performance",
    provider: "Google Skillshop",
  },
];

const categoryConfig: Record<OKRCategory, { label: string; icon: typeof Target; badgeClass: string }> = {
  performance: { label: "Performance", icon: Target, badgeClass: "badge-green" },
  skill: { label: "Skill", icon: Zap, badgeClass: "badge-blue" },
  learning: { label: "Learning", icon: GraduationCap, badgeClass: "badge-yellow" },
  career: { label: "Karriere", icon: TrendingUp, badgeClass: "badge-gray" },
};

export default function LearningsPage() {
  const [courses] = useState<Course[]>(PLACEHOLDER_COURSES);
  const [addedCourseIds, setAddedCourseIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddCourse = async (courseId: string) => {
    setAddingId(courseId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setAddedCourseIds((prev) => new Set(prev).add(courseId));
    setAddingId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Learning &amp; Education
          </h1>
          <p className="text-[11px] text-muted">
            Dein Entwicklungsprotokoll
          </p>
        </div>
        <button className="btn-secondary text-[13px] gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Vorschlagen
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {courses.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <p className="empty-state-title">Noch keine Kurse</p>
            <p className="empty-state-description">
              Entdecke Kurse und Lernressourcen, die zu deinen OKRs passen.
              <br />
              Klicke auf &quot;Vorschlagen&quot; um personalisierte Empfehlungen zu erhalten.
            </p>
          </div>
        ) : (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => {
              const config = categoryConfig[course.category];
              const Icon = config.icon;
              const isAdded = addedCourseIds.has(course.id);
              const isAdding = addingId === course.id;

              return (
                <div
                  key={course.id}
                  className="card card-hover p-5 flex flex-col"
                >
                  {/* Category + Duration */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${config.badgeClass} text-[10px]`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                  </div>

                  {/* Title + Description */}
                  <h3 className="text-[14px] font-medium text-foreground mb-1.5">
                    {course.name}
                  </h3>
                  <p className="text-[12px] text-muted mb-1 line-clamp-2 flex-1">
                    {course.description}
                  </p>

                  {/* Provider */}
                  <p className="text-[11px] text-muted mb-4">
                    von {course.provider}
                  </p>

                  {/* Action */}
                  <button
                    onClick={() => handleAddCourse(course.id)}
                    disabled={isAdded || isAdding}
                    className={isAdded ? "btn-ghost text-[12px] opacity-60 cursor-default" : "btn-secondary text-[12px] w-full gap-1.5"}
                  >
                    {isAdding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isAdded ? (
                      "Hinzugefügt"
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Hinzufügen
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
