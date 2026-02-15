"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  TrendingUp,
  Wrench,
  BookOpen,
  Briefcase,
  Trash2,
} from "lucide-react";
import type { OKR, OKRCategory, CreateOKRRequest } from "@/types";
import { getCurrentQuarter, getNextQuarter } from "@/components/layout/DashboardClientWrapper";

interface OKRFormProps {
  initialData?: OKR;
  currentQuarter?: string;
  onSubmit: (data: CreateOKRRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface KeyResultInput {
  id: string;
  title: string;
  start_value: string;
  target_value: string;
  unit: string;
}

const categories: { value: OKRCategory; label: string; icon: React.ReactNode }[] = [
  { value: "performance", label: "Performance", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "skill", label: "Skill", icon: <Wrench className="h-4 w-4" /> },
  { value: "learning", label: "Learning", icon: <BookOpen className="h-4 w-4" /> },
  { value: "career", label: "Karriere", icon: <Briefcase className="h-4 w-4" /> },
];

function generateId() {
  return `kr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function OKRForm({
  initialData,
  currentQuarter,
  onSubmit,
  onCancel,
  isLoading = false,
}: OKRFormProps) {
  const isEditing = !!initialData;
  const defaultQuarter = currentQuarter || getCurrentQuarter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [whyItMatters, setWhyItMatters] = useState(initialData?.why_it_matters || "");
  const [category, setCategory] = useState<OKRCategory>(initialData?.category || "performance");
  const [quarter, setQuarter] = useState(initialData?.quarter || defaultQuarter);
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
    return [{ id: generateId(), title: "", start_value: "0", target_value: "100", unit: "%" }];
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

  const addKeyResult = () => {
    setKeyResults((prev) => [
      ...prev,
      { id: generateId(), title: "", start_value: "0", target_value: "100", unit: "%" },
    ]);
  };

  const removeKeyResult = (id: string) => {
    if (keyResults.length <= 1) return;
    setKeyResults((prev) => prev.filter((kr) => kr.id !== id));
  };

  const updateKeyResult = (id: string, field: keyof KeyResultInput, value: string) => {
    setKeyResults((prev) =>
      prev.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validKRs = keyResults
      .filter((kr) => kr.title.trim())
      .map((kr) => ({
        title: kr.title.trim(),
        start_value: parseFloat(kr.start_value) || 0,
        target_value: parseFloat(kr.target_value) || 100,
        unit: kr.unit || undefined,
      }));

    onSubmit({
      title: title.trim(),
      why_it_matters: whyItMatters.trim() || undefined,
      quarter,
      category,
      key_results: validKRs,
    });
  };

  // Build quarter options
  const quarterOptions: string[] = [];
  let q = getCurrentQuarter();
  // Show previous 2 quarters, current, and next 4
  for (let i = 0; i < 2; i++) {
    q = getPrevQuarterLocal(q);
  }
  for (let i = 0; i < 7; i++) {
    quarterOptions.push(q);
    q = getNextQuarter(q);
  }

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
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "OKR bearbeiten" : "Neues OKR erstellen"}
            </h2>
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
            {/* Title */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Titel *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Kundenzufriedenheit um 20% steigern"
                className="input"
                required
                autoFocus
              />
            </div>

            {/* Why it matters */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Warum ist das wichtig?
              </label>
              <textarea
                value={whyItMatters}
                onChange={(e) => setWhyItMatters(e.target.value)}
                placeholder="Kontext und Motivation für dieses OKR..."
                className="input"
                rows={3}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Kategorie
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
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
            </div>

            {/* Quarter */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Quartal
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="input"
              >
                {quarterOptions.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Key Results */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Key Results
              </label>
              <div className="space-y-3">
                {keyResults.map((kr, index) => (
                  <div key={kr.id} className="bg-cream-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted font-medium">KR {index + 1}</span>
                      <div className="flex-1" />
                      {keyResults.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKeyResult(kr.id)}
                          className="p-1 hover:bg-cream-200 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted hover:text-red-500" />
                        </button>
                      )}
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
              <button
                type="button"
                onClick={addKeyResult}
                className="btn-ghost text-[13px] gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Key Result hinzufügen
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-cream-300/50">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? "Speichern..." : isEditing ? "Speichern" : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
