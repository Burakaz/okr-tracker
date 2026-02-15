"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { OKR, DuplicateOKRRequest } from "@/types";
import { getCurrentQuarter, getNextQuarter } from "@/components/layout/DashboardClientWrapper";

interface DuplicateOKRDialogProps {
  okr: OKR;
  onSubmit: (data: DuplicateOKRRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DuplicateOKRDialog({
  okr,
  onSubmit,
  onCancel,
  isLoading = false,
}: DuplicateOKRDialogProps) {
  const nextQ = getNextQuarter(okr.quarter);
  const [targetQuarter, setTargetQuarter] = useState(nextQ);
  const [resetProgress, setResetProgress] = useState(true);
  const [copyKeyResults, setCopyKeyResults] = useState(true);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      target_quarter: targetQuarter,
      reset_progress: resetProgress,
      copy_key_results: copyKeyResults,
    });
  };

  // Build quarter options - current + next 4 quarters
  const quarterOptions: string[] = [];
  let q = getCurrentQuarter();
  for (let i = 0; i < 5; i++) {
    quarterOptions.push(q);
    q = getNextQuarter(q);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cream-300/50">
            <h2 className="text-lg font-semibold text-foreground">OKR duplizieren</h2>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-muted">
              &quot;{okr.title}&quot; wird als neues OKR dupliziert.
            </p>

            {/* Target Quarter */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Ziel-Quartal
              </label>
              <select
                value={targetQuarter}
                onChange={(e) => setTargetQuarter(e.target.value)}
                className="input"
              >
                {quarterOptions.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    resetProgress
                      ? "bg-accent-green border-accent-green"
                      : "border-cream-400"
                  }`}
                >
                  {resetProgress && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={resetProgress}
                  onChange={(e) => setResetProgress(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-[13px] text-foreground">Fortschritt zurücksetzen</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    copyKeyResults
                      ? "bg-accent-green border-accent-green"
                      : "border-cream-400"
                  }`}
                >
                  {copyKeyResults && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={copyKeyResults}
                  onChange={(e) => setCopyKeyResults(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-[13px] text-foreground">Key Results kopieren</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-cream-300/50">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Duplizieren..." : "Duplizieren"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
