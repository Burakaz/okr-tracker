"use client";

import { useState } from "react";
import { MessageSquare, Check, Loader2 } from "lucide-react";
import type { OKR } from "@/types";

interface InlineCheckinProps {
  okr: OKR;
  onSubmit: (data: {
    confidence: number;
    note?: string;
    key_result_updates?: Array<{ id: string; current_value: number }>;
  }) => void;
  isLoading?: boolean;
}

const confidenceOptions = [
  { value: 4, emoji: "\uD83D\uDE0A", label: "On Track" },
  { value: 3, emoji: "\uD83D\uDE10", label: "Risiko" },
  { value: 2, emoji: "\uD83D\uDE1F", label: "Probleme" },
] as const;

export function InlineCheckin({ okr, onSubmit, isLoading = false }: InlineCheckinProps) {
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (selectedConfidence === null) return;

    onSubmit({
      confidence: selectedConfidence,
      note: note.trim() || undefined,
    });

    // Show success animation
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedConfidence(null);
      setNote("");
      setShowNote(false);
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="bg-cream-50 rounded-lg p-3 border border-cream-200">
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-medium text-accent-green">
            Check-in gespeichert
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-lg p-3 border border-cream-200">
      <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
        Quick Check-in
      </h4>

      {/* Confidence Selector */}
      <div className="flex items-center gap-2 mb-2">
        {confidenceOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelectedConfidence(option.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              selectedConfidence === option.value
                ? "bg-white border-2 border-accent-green shadow-sm"
                : "bg-white border border-cream-300 hover:border-cream-400"
            }`}
            aria-pressed={selectedConfidence === option.value}
            aria-label={`Zuversicht: ${option.label}`}
          >
            <span aria-hidden="true">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Note toggle + textarea */}
      {!showNote ? (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors mb-3"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Notiz hinzufügen...
        </button>
      ) : (
        <div className="mb-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Kurze Notiz zum Status..."
            className="input text-[13px]"
            rows={2}
            aria-label="Check-in Notiz"
            autoFocus
          />
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedConfidence === null || isLoading}
          className="btn-success text-[12px] py-1.5 px-4 gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Speichern...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}
