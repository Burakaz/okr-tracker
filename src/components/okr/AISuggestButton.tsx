"use client";

import { useState } from "react";
import { Sparkles, Plus, X, Loader2 } from "lucide-react";
import { useSuggestKPIs } from "@/hooks/useSuggestKPIs";
import type { SuggestedKR, AISuggestRequest } from "@/lib/ai/types";

interface AISuggestButtonProps {
  okrTitle: string;
  category: AISuggestRequest["category"];
  existingKRs?: string[];
  onAccept: (kr: SuggestedKR) => void;
  disabled?: boolean;
}

export default function AISuggestButton({
  okrTitle,
  category,
  existingKRs,
  onAccept,
  disabled = false,
}: AISuggestButtonProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { mutate, data, isPending, error, reset } = useSuggestKPIs();

  const handleSuggest = () => {
    if (okrTitle.length < 3) return;

    mutate(
      {
        okr_title: okrTitle,
        category,
        existing_krs: existingKRs,
      },
      {
        onSuccess: () => setShowSuggestions(true),
      }
    );
  };

  const handleAccept = (suggestion: SuggestedKR) => {
    onAccept(suggestion);
    // Remove accepted suggestion from display
    if (data) {
      const remaining = data.suggestions.filter((s) => s !== suggestion);
      if (remaining.length === 0) {
        setShowSuggestions(false);
        reset();
      }
    }
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
    reset();
  };

  // Don't show button if title is too short
  if (okrTitle.length < 3) return null;

  return (
    <div className="space-y-3">
      {/* Suggest Button */}
      {!showSuggestions && (
        <button
          type="button"
          onClick={handleSuggest}
          disabled={disabled || isPending}
          className="btn-ghost text-xs flex items-center gap-1.5 text-accent-green hover:text-accent-greenDark"
          aria-label="KPI-Vorschläge mit KI generieren"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>KI generiert Vorschläge…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>KI-Vorschläge für Key Results</span>
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && !showSuggestions && (
        <p className="text-xs text-red-500" role="alert">
          {error.message}
        </p>
      )}

      {/* Suggestions Panel */}
      {showSuggestions && data && data.suggestions.length > 0 && (
        <div
          className="rounded-lg border border-accent-greenLight bg-accent-greenLight/10 p-3 space-y-2"
          role="region"
          aria-label="KI-generierte KPI-Vorschläge"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles
                className="h-3.5 w-3.5 text-accent-green"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-accent-greenDark">
                KI-Vorschläge
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted hover:text-foreground p-0.5 rounded"
              aria-label="Vorschläge schließen"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1.5">
            {data.suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.title}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md bg-white/80 px-3 py-2 text-xs border border-cream-300/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {suggestion.title}
                  </p>
                  <p className="text-muted">
                    {suggestion.start_value} → {suggestion.target_value}{" "}
                    {suggestion.unit}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAccept(suggestion)}
                  className="flex-shrink-0 flex items-center gap-1 text-accent-green hover:text-accent-greenDark font-medium"
                  aria-label={`Key Result "${suggestion.title}" übernehmen`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Übernehmen</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
