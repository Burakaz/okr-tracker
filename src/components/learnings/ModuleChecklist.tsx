"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToggleModuleCompletion } from "@/lib/queries";
import { toast } from "sonner";
import type { CourseModule, ModuleCompletion } from "@/types";

interface ModuleChecklistProps {
  modules: CourseModule[];
  completions: ModuleCompletion[];
  enrollmentId?: string;
  courseId: string;
  readOnly?: boolean;
}

export function ModuleChecklist({
  modules,
  completions,
  courseId,
  readOnly = false,
}: ModuleChecklistProps) {
  const toggleMutation = useToggleModuleCompletion();

  // Optimistic state: track which module IDs to treat as toggled
  const [optimisticToggles, setOptimisticToggles] = useState<
    Record<string, boolean>
  >({});

  const sortedModules = [...modules].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const isModuleCompleted = (moduleId: string): boolean => {
    if (moduleId in optimisticToggles) {
      return optimisticToggles[moduleId];
    }
    return completions.some((c) => c.module_id === moduleId);
  };

  const completedCount = sortedModules.filter((m) =>
    isModuleCompleted(m.id)
  ).length;
  const totalCount = sortedModules.length;
  const progressValue = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = async (moduleId: string) => {
    if (readOnly) return;

    const wasCompleted = isModuleCompleted(moduleId);
    const newState = !wasCompleted;

    // Optimistic update
    setOptimisticToggles((prev) => ({ ...prev, [moduleId]: newState }));

    try {
      await toggleMutation.mutateAsync({ courseId, moduleId });
      // Clear optimistic toggle after server confirms
      setOptimisticToggles((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
    } catch {
      // Revert optimistic update
      setOptimisticToggles((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
      toast.error("Fehler beim Aktualisieren des Moduls");
    }
  };

  return (
    <div className="space-y-2">
      {sortedModules.map((module) => {
        const completed = isModuleCompleted(module.id);

        return (
          <div
            key={module.id}
            className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
              readOnly ? "" : "hover:bg-cream-50 cursor-pointer"
            }`}
            onClick={() => handleToggle(module.id)}
            role={readOnly ? undefined : "button"}
            tabIndex={readOnly ? undefined : 0}
            onKeyDown={(e) => {
              if (!readOnly && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleToggle(module.id);
              }
            }}
            aria-label={`${module.title} ${completed ? "(abgeschlossen)" : "(offen)"}`}
          >
            {/* Checkbox */}
            <div
              className={`module-checkbox ${completed ? "checked" : ""} ${
                readOnly ? "opacity-60" : ""
              }`}
            >
              {completed && (
                <Check className="h-3 w-3 text-white" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] font-medium ${
                  completed ? "module-completed" : "text-foreground"
                }`}
              >
                {module.title}
              </p>
              {module.description && (
                <p className="text-[12px] text-muted mt-0.5">
                  {module.description}
                </p>
              )}
            </div>

            {/* Duration */}
            {module.estimated_minutes != null && module.estimated_minutes > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted whitespace-nowrap flex-shrink-0">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {module.estimated_minutes} Min.
              </span>
            )}
          </div>
        );
      })}

      {/* Progress bar at bottom */}
      {totalCount > 0 && (
        <div className="pt-3 border-t border-cream-200 mt-2">
          <ProgressBar value={progressValue} size="sm" showLabel />
          <p className="text-[11px] text-muted mt-1.5">
            {completedCount} von {totalCount} Modulen abgeschlossen
          </p>
        </div>
      )}
    </div>
  );
}
