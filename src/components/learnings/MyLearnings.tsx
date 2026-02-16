"use client";

import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Layers,
} from "lucide-react";
import { CourseCard } from "./CourseCard";
import type { Enrollment } from "@/types";

interface MyLearningsProps {
  enrollments: Enrollment[];
  isLoading: boolean;
  onViewDetail: (id: string) => void;
  onSwitchToCatalog: () => void;
}

function SkeletonStatCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-3 bg-cream-200 rounded w-10 mb-2" />
      <div className="h-7 bg-cream-200 rounded w-8 mb-1" />
      <div className="h-2.5 bg-cream-200 rounded w-16" />
    </div>
  );
}

export function MyLearnings({
  enrollments,
  isLoading,
  onViewDetail,
  onSwitchToCatalog,
}: MyLearningsProps) {
  const totalEnrolled = enrollments.length;
  const completedCount = enrollments.filter(
    (e) => e.status === "completed"
  ).length;
  const inProgressCount = enrollments.filter(
    (e) => e.status === "in_progress"
  ).length;
  const totalModulesDone = enrollments.reduce(
    (acc, e) => acc + (e.module_completions?.length ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
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
      </div>
    );
  }

  const stats = [
    {
      icon: <BookOpen className="h-4 w-4 text-blue-500" />,
      count: totalEnrolled,
      label: "Eingeschrieben",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      count: completedCount,
      label: "Abgeschlossen",
    },
    {
      icon: <PlayCircle className="h-4 w-4 text-amber-500" />,
      count: inProgressCount,
      label: "In Arbeit",
    },
    {
      icon: <Layers className="h-4 w-4 text-purple-500" />,
      count: totalModulesDone,
      label: "Module fertig",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="mb-1.5">{stat.icon}</div>
            <p className="text-2xl font-bold text-foreground">{stat.count}</p>
            <p className="text-[11px] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled courses */}
      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrollments.map((enrollment) => {
            if (!enrollment.course) return null;
            return (
              <CourseCard
                key={enrollment.id}
                course={enrollment.course}
                enrollment={enrollment}
                onViewDetail={onViewDetail}
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
            Du hast noch keine Kurse begonnen
          </p>
          <p className="empty-state-description mb-4">
            Starte mit einem Kurs aus dem Katalog, um deine Lernreise zu
            beginnen.
          </p>
          <button className="btn-primary" onClick={onSwitchToCatalog}>
            Kurskatalog durchsuchen
          </button>
        </div>
      )}
    </div>
  );
}
