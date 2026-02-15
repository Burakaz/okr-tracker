"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { OKR, ConfidenceLevel, CreateCheckinRequest } from "@/types";

interface CheckinDialogProps {
  okr: OKR;
  onSubmit: (data: CreateCheckinRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const confidenceLabels: Record<ConfidenceLevel, string> = {
  1: "Wird nicht erreicht",
  2: "Unwahrscheinlich",
  3: "Möglich",
  4: "Wahrscheinlich",
  5: "Wird erreicht",
};

export function CheckinDialog({
  okr,
  onSubmit,
  onCancel,
  isLoading = false,
}: CheckinDialogProps) {
  const [confidence, setConfidence] = useState<ConfidenceLevel>(okr.confidence);
  const [whatHelped, setWhatHelped] = useState("");
  const [whatBlocked, setWhatBlocked] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [krValues, setKrValues] = useState<Record<string, number>>(() => {
    const values: Record<string, number> = {};
    okr.key_results?.forEach((kr) => {
      values[kr.id] = kr.current_value;
    });
    return values;
  });

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

    const keyResultUpdates = Object.entries(krValues).map(([id, current_value]) => ({
      id,
      current_value,
    }));

    onSubmit({
      confidence,
      what_helped: whatHelped.trim() || undefined,
      what_blocked: whatBlocked.trim() || undefined,
      next_steps: nextSteps.trim() || undefined,
      key_result_updates: keyResultUpdates,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ maxWidth: "32rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cream-300/50">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Check-in</h2>
              <p className="text-[13px] text-muted truncate max-w-[300px]">{okr.title}</p>
            </div>
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
            {/* Key Results Updates */}
            {okr.key_results && okr.key_results.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-3">
                  Key Results aktualisieren
                </label>
                <div className="space-y-4">
                  {okr.key_results.map((kr) => {
                    const currentValue = krValues[kr.id] ?? kr.current_value;
                    const progressPercent = kr.target_value > kr.start_value
                      ? ((currentValue - kr.start_value) / (kr.target_value - kr.start_value)) * 100
                      : 0;

                    return (
                      <div key={kr.id} className="bg-cream-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-medium text-foreground truncate pr-2">
                            {kr.title}
                          </p>
                          <span className="text-[11px] text-muted whitespace-nowrap">
                            {currentValue}{kr.unit ? ` ${kr.unit}` : ""} / {kr.target_value}{kr.unit ? ` ${kr.unit}` : ""}
                          </span>
                        </div>
                        {/* Range slider */}
                        <input
                          type="range"
                          min={kr.start_value}
                          max={kr.target_value}
                          step={(kr.target_value - kr.start_value) / 100 || 1}
                          value={currentValue}
                          onChange={(e) =>
                            setKrValues((prev) => ({
                              ...prev,
                              [kr.id]: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-1.5 bg-cream-300 rounded-full appearance-none cursor-pointer accent-accent-green"
                          style={{
                            background: `linear-gradient(to right, var(--accent-green) 0%, var(--accent-green) ${Math.min(progressPercent, 100)}%, var(--cream-300) ${Math.min(progressPercent, 100)}%, var(--cream-300) 100%)`,
                          }}
                        />
                        {/* Number input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={currentValue}
                            onChange={(e) =>
                              setKrValues((prev) => ({
                                ...prev,
                                [kr.id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            min={kr.start_value}
                            max={kr.target_value * 2}
                            className="input w-24 text-center"
                          />
                          {kr.unit && (
                            <span className="text-[12px] text-muted">{kr.unit}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confidence Selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Confidence
              </label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(level)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                      confidence === level
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted text-center mt-1.5">
                {confidenceLabels[confidence]}
              </p>
            </div>

            {/* Reflection Text Areas */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Was lief gut?
              </label>
              <textarea
                value={whatHelped}
                onChange={(e) => setWhatHelped(e.target.value)}
                placeholder="Erfolge und positive Entwicklungen..."
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Was hat blockiert?
              </label>
              <textarea
                value={whatBlocked}
                onChange={(e) => setWhatBlocked(e.target.value)}
                placeholder="Hindernisse und Herausforderungen..."
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Nächste Schritte
              </label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Geplante Aktionen..."
                className="input"
                rows={2}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-cream-300/50">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-success" disabled={isLoading}>
              {isLoading ? "Speichern..." : "Check-in speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
