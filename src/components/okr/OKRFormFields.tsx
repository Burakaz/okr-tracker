"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Plus,
  Target,
  Zap,
  BookOpen,
  Briefcase,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import type { OKR, OKRCategory, OKRScope, CreateOKRRequest } from "@/types";
import { getCurrentQuarter, getNextQuarter } from "@/lib/okr-logic";
import { useSuggestKPIs } from "@/hooks/useSuggestKPIs";
import { CourseSelector, type SelectedCourse } from "./CourseSelector";

export interface OKRFormFieldsProps {
  initialData?: OKR;
  currentQuarter?: string;
  onSubmit: (data: CreateOKRRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  layout: "modal" | "page";
}

interface KeyResultInput {
  id: string;
  title: string;
  start_value: string;
  target_value: string;
  unit: string;
}

const categories: { value: OKRCategory; label: string; icon: React.ReactNode }[] = [
  { value: "performance", label: "Performance", icon: <Target className="h-4 w-4" /> },
  { value: "skill", label: "Skill", icon: <Zap className="h-4 w-4" /> },
  { value: "learning", label: "Lernen", icon: <BookOpen className="h-4 w-4" /> },
  { value: "career", label: "Karriere", icon: <Briefcase className="h-4 w-4" /> },
];

const scopeOptions: { value: OKRScope; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
  { value: "company", label: "Company" },
];

function generateId() {
  return `kr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getPrevQuarterLocal(quarter: string): string {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) return quarter;
  let q = parseInt(match[1]);
  let y = parseInt(match[2]);
  q -= 1;
  if (q < 1) {
    q = 4;
    y -= 1;
  }
  return `Q${q} ${y}`;
}

export function OKRFormFields({
  initialData,
  currentQuarter,
  onSubmit,
  onCancel,
  isLoading = false,
  layout,
}: OKRFormFieldsProps) {
  const isEditing = !!initialData;
  const defaultQuarter = currentQuarter || getCurrentQuarter();

  // Wizard step (only used for modal layout): in edit mode, start at step 2
  const [step, setStep] = useState(initialData ? 2 : 1);

  // Form fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [whyItMatters, setWhyItMatters] = useState(initialData?.why_it_matters || "");
  const [category, setCategory] = useState<OKRCategory>(initialData?.category || "performance");
  const [quarter, setQuarter] = useState(initialData?.quarter || defaultQuarter);
  const [scope, setScope] = useState<OKRScope>(initialData?.scope || "personal");
  const [showDetails, setShowDetails] = useState(!!initialData?.why_it_matters);

  // Key results
  const [keyResults, setKeyResults] = useState<KeyResultInput[]>(() => {
    if (initialData?.key_results && initialData.key_results.length > 0) {
      return initialData.key_results.map((kr) => ({
        id: kr.id,
        title: kr.title,
        start_value: String(kr.start_value),
        target_value: String(kr.target_value),
        unit: kr.unit || "",
      }));
    }
    return [];
  });

  // Course selection state (for learning OKRs)
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);

  // AI suggestions state
  const suggestMutation = useSuggestKPIs();
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());
  const hasSuggestedRef = useRef(false);

  // For page layout, auto-trigger AI when title is long enough (not learning, not editing)
  // For modal layout, auto-trigger when entering step 2
  useEffect(() => {
    const shouldTrigger =
      layout === "modal"
        ? step === 2 && title.length >= 3 && !initialData && !hasSuggestedRef.current && category !== "learning"
        : title.length >= 3 && !initialData && !hasSuggestedRef.current && category !== "learning";

    if (shouldTrigger) {
      hasSuggestedRef.current = true;
      suggestMutation.mutate(
        { okr_title: title, category },
        {
          onSuccess: (data) => {
            const indices = new Set<number>();
            data.suggestions.forEach((_, i) => indices.add(i));
            setAcceptedSuggestions(indices);
          },
        }
      );
    }
  }, [step, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  // For page layout, re-trigger AI when title changes (debounced via manual trigger only)
  // We won't auto-trigger on every keystroke; user can click "Neu generieren"

  // Key result helpers
  const addKeyResult = () => {
    setKeyResults((prev) => [
      ...prev,
      { id: generateId(), title: "", start_value: "0", target_value: "100", unit: "%" },
    ]);
  };

  const removeKeyResult = (id: string) => {
    setKeyResults((prev) => prev.filter((kr) => kr.id !== id));
  };

  const updateKeyResult = (id: string, field: keyof KeyResultInput, value: string) => {
    setKeyResults((prev) =>
      prev.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr))
    );
  };

  // Toggle AI suggestion acceptance
  const toggleSuggestion = (index: number) => {
    setAcceptedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Retry AI suggestions
  const handleRetrySuggest = () => {
    suggestMutation.mutate(
      {
        okr_title: title,
        category,
        existing_krs: keyResults.filter((kr) => kr.title.trim()).map((kr) => kr.title),
      },
      {
        onSuccess: (data) => {
          const indices = new Set<number>();
          data.suggestions.forEach((_, i) => indices.add(i));
          setAcceptedSuggestions(indices);
        },
      }
    );
  };

  // Navigate to step 2 (modal only)
  const goToStep2 = () => {
    if (title.trim().length < 3) return;
    setStep(2);
  };

  // Navigate back to step 1 (modal only)
  const goToStep1 = () => {
    setStep(1);
    hasSuggestedRef.current = false;
    suggestMutation.reset();
    setAcceptedSuggestions(new Set());
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) return;

    // Collect accepted AI suggestions
    const aiKRs: Array<{ title: string; start_value: number; target_value: number; unit?: string }> = [];
    if (suggestMutation.data) {
      suggestMutation.data.suggestions.forEach((suggestion, index) => {
        if (acceptedSuggestions.has(index)) {
          aiKRs.push({
            title: suggestion.title,
            start_value: suggestion.start_value,
            target_value: suggestion.target_value,
            unit: suggestion.unit || undefined,
          });
        }
      });
    }

    // Collect manually added KRs
    const manualKRs = keyResults
      .filter((kr) => kr.title.trim())
      .map((kr) => ({
        ...(isEditing && !kr.id.startsWith("kr-") ? { id: kr.id } : {}),
        title: kr.title.trim(),
        start_value: parseFloat(kr.start_value) || 0,
        target_value: parseFloat(kr.target_value) || 100,
        unit: kr.unit || undefined,
      }));

    // Collect course-based KRs
    const courseKRs = selectedCourses.map((c) => ({
      title: c.title,
      start_value: 0,
      target_value: c.moduleCount || 1,
      unit: "Module",
      course_id: c.courseId,
    }));

    const allKRs = [...courseKRs, ...aiKRs, ...manualKRs];

    if (allKRs.length === 0) {
      setFormError(
        category === "learning"
          ? "Waehle mindestens einen Kurs aus."
          : "Mindestens 1 Key Result ist erforderlich."
      );
      return;
    }

    onSubmit({
      title: title.trim(),
      why_it_matters: whyItMatters.trim() || undefined,
      quarter,
      category,
      scope,
      key_results: allKRs,
    });
  };

  // Build quarter options
  const quarterOptions = useMemo(() => {
    const options: string[] = [];
    let q = getCurrentQuarter();
    for (let i = 0; i < 2; i++) {
      q = getPrevQuarterLocal(q);
    }
    for (let i = 0; i < 7; i++) {
      options.push(q);
      q = getNextQuarter(q);
    }
    return options;
  }, []);

  // Count total selected KRs
  const totalKRs = selectedCourses.length + acceptedSuggestions.size + keyResults.filter((kr) => kr.title.trim()).length;

  // ===================== SHARED BUILDING BLOCKS =====================

  const titleInput = (autoFocus: boolean = false, large: boolean = false) => (
    <div>
      <label htmlFor="okr-title" className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
        Titel *
      </label>
      <input
        id="okr-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="z.B. Kundenzufriedenheit um 20% steigern"
        className={large ? "input text-lg font-medium" : "input"}
        autoFocus={autoFocus}
      />
    </div>
  );

  const categorySelector = () => (
    <fieldset>
      <legend className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
        Kategorie
      </legend>
      <div className={layout === "page" ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 gap-2"}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            aria-pressed={category === cat.value}
            className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-medium transition-all ${
              category === cat.value
                ? "bg-foreground text-white"
                : "bg-cream-200/60 text-muted hover:bg-cream-200"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>
    </fieldset>
  );

  const quarterSelector = () => (
    <div>
      <label htmlFor="okr-quarter" className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
        Quartal
      </label>
      <div className="relative">
        <select
          id="okr-quarter"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="input appearance-none pr-8"
        >
          {quarterOptions.map((qo) => (
            <option key={qo} value={qo}>
              {qo}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );

  const scopeSelector = () => (
    <div>
      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
        Bereich
      </label>
      <div className={layout === "page" ? "flex flex-col gap-2" : "flex gap-2"}>
        {scopeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setScope(opt.value)}
            aria-pressed={scope === opt.value}
            className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
              scope === opt.value
                ? "bg-foreground text-white"
                : "bg-cream-200/60 text-muted hover:bg-cream-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const whyItMattersField = () => (
    <div>
      <label htmlFor="okr-why" className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
        Warum ist das wichtig?
      </label>
      <textarea
        id="okr-why"
        value={whyItMatters}
        onChange={(e) => setWhyItMatters(e.target.value)}
        placeholder="Kontext und Motivation fuer dieses OKR..."
        className="input"
        rows={3}
      />
    </div>
  );

  const courseSelectorBlock = () => (
    category === "learning" && !isEditing ? (
      <CourseSelector
        selected={selectedCourses}
        onSelectionChange={setSelectedCourses}
      />
    ) : null
  );

  const aiSuggestionsBlock = () => (
    !isEditing && category !== "learning" ? (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent-green" aria-hidden="true" />
            KI-Vorschlaege
          </label>
          {suggestMutation.data && !suggestMutation.isPending && (
            <button
              type="button"
              onClick={handleRetrySuggest}
              className="text-[11px] text-accent-green hover:text-accent-greenDark font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Neu generieren
            </button>
          )}
        </div>

        {suggestMutation.isPending && (
          <div className="rounded-lg border border-accent-greenLight bg-accent-greenLight/10 p-4 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent-green flex-shrink-0" aria-hidden="true" />
            <span className="text-[13px] text-muted">KI generiert Vorschlaege...</span>
          </div>
        )}

        {suggestMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-[13px] text-red-600 mb-2">{suggestMutation.error?.message || "Fehler beim Laden der Vorschlaege"}</p>
            <button
              type="button"
              onClick={handleRetrySuggest}
              className="text-[12px] text-red-700 font-medium hover:text-red-800 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {suggestMutation.data && suggestMutation.data.suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestMutation.data.suggestions.map((suggestion, index) => {
              const isAccepted = acceptedSuggestions.has(index);
              return (
                <button
                  key={`ai-${index}`}
                  type="button"
                  onClick={() => toggleSuggestion(index)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    isAccepted
                      ? "border-accent-green bg-accent-greenLight/10"
                      : "border-cream-300/50 bg-cream-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isAccepted
                          ? "bg-accent-green border-accent-green"
                          : "border-cream-300 bg-white"
                      }`}
                    >
                      {isAccepted && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{suggestion.title}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {suggestion.start_value} &rarr; {suggestion.target_value} {suggestion.unit}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Trigger button for page layout when no suggestions yet */}
        {layout === "page" && !suggestMutation.data && !suggestMutation.isPending && title.length >= 3 && (
          <button
            type="button"
            onClick={() => {
              hasSuggestedRef.current = true;
              suggestMutation.mutate(
                { okr_title: title, category },
                {
                  onSuccess: (data) => {
                    const indices = new Set<number>();
                    data.suggestions.forEach((_, i) => indices.add(i));
                    setAcceptedSuggestions(indices);
                  },
                }
              );
            }}
            className="btn-ghost text-[12px] flex items-center gap-1.5 text-accent-green hover:text-accent-greenDark"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>KI-Vorschlaege generieren</span>
          </button>
        )}
      </div>
    ) : null
  );

  const manualKeyResultsBlock = () => (
    <div>
      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
        {isEditing ? "Key Results" : "Eigene Key Results"}
      </label>
      {keyResults.length > 0 && (
        <div className="space-y-3 mb-3">
          {keyResults.map((kr, index) => (
            <div key={kr.id} className="bg-cream-50 rounded-lg p-3 space-y-2 border border-cream-300/50">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted font-medium">
                  {isEditing ? `KR ${index + 1}` : "Eigenes KR"}
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => removeKeyResult(kr.id)}
                  className="p-1 hover:bg-cream-200 rounded transition-colors"
                  aria-label="Key Result entfernen"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted hover:text-red-500" aria-hidden="true" />
                </button>
              </div>
              <input
                type="text"
                value={kr.title}
                onChange={(e) => updateKeyResult(kr.id, "title", e.target.value)}
                placeholder="Key Result Beschreibung"
                className="input"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">Start</label>
                  <input
                    type="number"
                    value={kr.start_value}
                    onChange={(e) => updateKeyResult(kr.id, "start_value", e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">Ziel</label>
                  <input
                    type="number"
                    value={kr.target_value}
                    onChange={(e) => updateKeyResult(kr.id, "target_value", e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">Einheit</label>
                  <input
                    type="text"
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(kr.id, "unit", e.target.value)}
                    placeholder="%"
                    className="input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={addKeyResult}
        className="btn-ghost text-[13px] gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Key Result hinzufuegen
      </button>

      {/* In edit mode, show AI suggest button inline */}
      {isEditing && title.length >= 3 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              suggestMutation.mutate(
                {
                  okr_title: title,
                  category,
                  existing_krs: keyResults.filter((kr) => kr.title.trim()).map((kr) => kr.title),
                },
                {
                  onSuccess: (data) => {
                    data.suggestions.forEach((s) => {
                      setKeyResults((prev) => [
                        ...prev,
                        {
                          id: generateId(),
                          title: s.title,
                          start_value: String(s.start_value),
                          target_value: String(s.target_value),
                          unit: s.unit,
                        },
                      ]);
                    });
                  },
                }
              );
            }}
            disabled={suggestMutation.isPending}
            className="btn-ghost text-[12px] flex items-center gap-1.5 text-accent-green hover:text-accent-greenDark"
          >
            {suggestMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>KI generiert...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>KI-Vorschlaege fuer Key Results</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const validationError = formError ? (
    <div id="okr-form-error" className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-[13px] text-red-600">{formError}</p>
    </div>
  ) : null;

  // ===================== PAGE LAYOUT =====================

  if (layout === "page") {
    return (
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left column (60%) */}
              <div className="lg:col-span-3 space-y-6">
                {titleInput(true, true)}
                {whyItMattersField()}
                {courseSelectorBlock()}
                {aiSuggestionsBlock()}
                {manualKeyResultsBlock()}
                {validationError}
              </div>

              {/* Right column (40%) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="lg:sticky lg:top-6 space-y-6">
                  {categorySelector()}
                  {quarterSelector()}
                  {scopeSelector()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div className="border-t border-cream-300/50 bg-background px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-muted">
                {totalKRs} KR{totalKRs !== 1 ? "s" : ""} ausgewaehlt
              </span>
              <button
                type="submit"
                className="btn-primary text-[13px]"
                disabled={isLoading || !title.trim()}
                aria-describedby={formError ? "okr-form-error" : undefined}
              >
                {isLoading ? "Speichern..." : isEditing ? "Speichern" : "Ziel erstellen"}
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // ===================== MODAL LAYOUT =====================

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-cream-300/50">
        <div className="flex items-center gap-3">
          <h2 id="okr-form-title" className="text-lg font-semibold text-foreground">
            {isEditing ? "OKR bearbeiten" : step === 1 ? "Was willst du erreichen?" : "Wie misst du den Erfolg?"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  step >= 1 ? "bg-accent-green" : "bg-cream-200"
                }`}
              />
              <div
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  step >= 2 ? "bg-accent-green" : "bg-cream-200"
                }`}
              />
            </div>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
            aria-label="Formular schliessen"
          >
            <X className="h-5 w-5 text-muted" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="p-6 space-y-5">
          {titleInput(true)}
          {categorySelector()}
          {quarterSelector()}

          {/* Optional details toggle */}
          {!showDetails ? (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-[13px] text-muted hover:text-foreground transition-colors"
            >
              + Details hinzufuegen
            </button>
          ) : (
            whyItMattersField()
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="p-6 space-y-5">
          {!isEditing && (
            <div className="bg-cream-50 rounded-lg px-4 py-3 border border-cream-300/50">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-0.5">
                Dein Ziel
              </p>
              <p className="text-[13px] font-medium text-foreground">{title}</p>
            </div>
          )}

          {isEditing && (
            <>
              {titleInput(true)}
              {categorySelector()}
              {quarterSelector()}
              {whyItMattersField()}
            </>
          )}

          {courseSelectorBlock()}
          {aiSuggestionsBlock()}
          {manualKeyResultsBlock()}
        </div>
      )}

      {/* Validation Error */}
      {formError && (
        <div className="mx-6 mb-0">
          {validationError}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-cream-300/50">
        <div>
          {step === 2 && !isEditing && (
            <button
              type="button"
              onClick={goToStep1}
              className="btn-ghost text-[13px] gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurueck
            </button>
          )}
          {(step === 1 || isEditing) && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step === 1 && (
            <button
              type="button"
              onClick={goToStep2}
              className="btn-primary text-[13px] gap-1.5"
              disabled={title.trim().length < 3}
            >
              Weiter
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {step === 2 && (
            <>
              {!isEditing && (
                <span className="text-[12px] text-muted">
                  {totalKRs} KR{totalKRs !== 1 ? "s" : ""} ausgewaehlt
                </span>
              )}
              <button
                type="submit"
                className="btn-primary text-[13px]"
                disabled={isLoading || !title.trim()}
                aria-describedby={formError ? "okr-form-error" : undefined}
              >
                {isLoading ? "Speichern..." : isEditing ? "Speichern" : "Ziel erstellen"}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
