"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, Link2, Unlink, ChevronDown, Loader2 } from "lucide-react";
import type { KeyResult, Enrollment, OKRCourseLink } from "@/types";

interface CourseLinkerProps {
  okrId: string;
  keyResults: KeyResult[];
  enrollments: Enrollment[];
  courseLinks?: OKRCourseLink[];
  onLinkCourse: (data: {
    okrId: string;
    key_result_id: string;
    enrollment_id: string;
    auto_update: boolean;
  }) => void;
  onUnlinkCourse?: (linkId: string) => void;
  isLinking?: boolean;
}

export function CourseLinker({
  okrId,
  keyResults,
  enrollments,
  courseLinks = [],
  onLinkCourse,
  onUnlinkCourse,
  isLinking = false,
}: CourseLinkerProps) {
  const [openDropdownKrId, setOpenDropdownKrId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownKrId(null);
      }
    }
    if (openDropdownKrId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdownKrId]);

  // Find linked enrollment for a given KR
  function getLinkedEnrollment(krId: string) {
    const link = courseLinks.find((l) => l.key_result_id === krId);
    if (!link) return null;
    const enrollment = enrollments.find((e) => e.id === link.enrollment_id);
    return enrollment ? { link, enrollment } : null;
  }

  // Enrollments not yet linked to any KR
  const linkedEnrollmentIds = new Set(courseLinks.map((l) => l.enrollment_id));
  const availableEnrollments = enrollments.filter(
    (e) => !linkedEnrollmentIds.has(e.id) && e.status !== "dropped"
  );

  if (keyResults.length === 0) return null;

  return (
    <div className="bg-blue-50/30 rounded-lg p-3 border border-blue-100">
      {/* Header */}
      <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        Verknüpfte Kurse
      </h4>

      {/* Key Results list */}
      <div className="space-y-2">
        {keyResults.map((kr) => {
          const linked = getLinkedEnrollment(kr.id);
          const isDropdownOpen = openDropdownKrId === kr.id;

          return (
            <div key={kr.id} className="bg-white rounded-lg p-3">
              {/* KR title */}
              <p className="text-[13px] font-medium text-foreground mb-1.5 truncate">
                KR: {kr.title}
              </p>

              {linked ? (
                /* Linked course display */
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen
                      className="h-3.5 w-3.5 text-blue-600 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] text-blue-600 bg-blue-50 rounded px-2 py-0.5 truncate">
                      {linked.enrollment.course?.title ??
                        "Unbekannter Kurs"}{" "}
                      ({Math.round(linked.enrollment.progress)}%)
                    </span>
                    {linked.link.auto_update && (
                      <span
                        className="text-[10px] text-muted"
                        title="Fortschritt wird automatisch synchronisiert"
                      >
                        <Link2
                          className="h-3 w-3 text-blue-400"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </div>
                  {onUnlinkCourse && (
                    <button
                      type="button"
                      onClick={() => onUnlinkCourse(linked.link.id)}
                      className="btn-ghost text-[11px] py-0.5 px-2 gap-1 text-muted hover:text-red-500 flex-shrink-0"
                      aria-label={`Verknüpfung von "${linked.enrollment.course?.title}" lösen`}
                    >
                      <Unlink className="h-3 w-3" aria-hidden="true" />
                      <span className="hidden sm:inline">
                        Verknüpfung lösen
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                /* Link course dropdown */
                <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdownKrId(isDropdownOpen ? null : kr.id)
                    }
                    disabled={
                      isLinking || availableEnrollments.length === 0
                    }
                    className="btn-ghost text-[12px] py-1 px-2.5 gap-1 text-blue-600 hover:bg-blue-50"
                    aria-label={`Kurs mit "${kr.title}" verknüpfen`}
                    aria-expanded={isDropdownOpen}
                  >
                    {isLinking ? (
                      <Loader2
                        className="h-3 w-3 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Link2 className="h-3 w-3" aria-hidden="true" />
                    )}
                    Kurs verknüpfen
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-cream-300 z-20 py-1">
                      {availableEnrollments.length === 0 ? (
                        <p className="text-[12px] text-muted px-3 py-2">
                          Keine verfügbaren Einschreibungen.
                        </p>
                      ) : (
                        availableEnrollments.map((enrollment) => (
                          <button
                            key={enrollment.id}
                            type="button"
                            onClick={() => {
                              onLinkCourse({
                                okrId,
                                key_result_id: kr.id,
                                enrollment_id: enrollment.id,
                                auto_update: true,
                              });
                              setOpenDropdownKrId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-cream-50 transition-colors flex items-center gap-2"
                          >
                            <BookOpen
                              className="h-3.5 w-3.5 text-blue-500 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] text-foreground truncate">
                                {enrollment.course?.title ??
                                  "Unbekannter Kurs"}
                              </p>
                              <p className="text-[11px] text-muted">
                                Fortschritt:{" "}
                                {Math.round(enrollment.progress)}%
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
