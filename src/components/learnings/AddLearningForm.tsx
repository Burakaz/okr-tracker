"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Palette,
  Code,
  Megaphone,
  Crown,
  BarChart3,
  MessageSquare,
  Package,
  Lightbulb,
} from "lucide-react";
import { useCreateCourse } from "@/lib/queries";
import { toast } from "sonner";
import type { CourseCategory, CourseDifficulty } from "@/types";

interface AddLearningFormProps {
  onClose: () => void;
  isLoading?: boolean;
}

interface ModuleInput {
  id: string;
  title: string;
  estimated_minutes: string;
}

const categories: {
  value: CourseCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "design", label: "Design", icon: <Palette className="h-4 w-4" /> },
  {
    value: "development",
    label: "Entwicklung",
    icon: <Code className="h-4 w-4" />,
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
  },
  {
    value: "leadership",
    label: "Leadership",
    icon: <Crown className="h-4 w-4" />,
  },
  { value: "data", label: "Daten", icon: <BarChart3 className="h-4 w-4" /> },
  {
    value: "communication",
    label: "Komm.",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    value: "product",
    label: "Produkt",
    icon: <Package className="h-4 w-4" />,
  },
  {
    value: "other",
    label: "Sonstige",
    icon: <Lightbulb className="h-4 w-4" />,
  },
];

const difficulties: { value: CourseDifficulty; label: string }[] = [
  { value: "beginner", label: "Einsteiger" },
  { value: "intermediate", label: "Fortgeschritten" },
  { value: "advanced", label: "Experte" },
];

function generateId() {
  return `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AddLearningForm({ onClose }: AddLearningFormProps) {
  const createCourse = useCreateCourse();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CourseCategory>("development");
  const [provider, setProvider] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [difficulty, setDifficulty] = useState<CourseDifficulty>("beginner");
  const [externalUrl, setExternalUrl] = useState("");
  const [modules, setModules] = useState<ModuleInput[]>([
    { id: generateId(), title: "", estimated_minutes: "" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { id: generateId(), title: "", estimated_minutes: "" },
    ]);
  };

  const removeModule = (id: string) => {
    if (modules.length <= 1) return;
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const updateModule = (
    id: string,
    field: keyof ModuleInput,
    value: string
  ) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) return;

    const validModules = modules
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title.trim(),
        estimated_minutes: m.estimated_minutes
          ? parseInt(m.estimated_minutes)
          : undefined,
      }));

    if (validModules.length === 0) {
      setFormError("Mindestens 1 Modul mit Titel ist erforderlich.");
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        provider: provider.trim() || undefined,
        estimated_duration_minutes: parseInt(durationMinutes) || 60,
        difficulty,
        external_url: externalUrl.trim() || undefined,
        modules: validModules,
      });
      toast.success("Kurs erstellt");
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Fehler beim Erstellen");
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-learning-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cream-300/50">
            <h2
              id="add-learning-title"
              className="text-lg font-semibold text-foreground"
            >
              Kurs hinzufuegen
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
              aria-label="Formular schliessen"
            >
              <X className="h-5 w-5 text-muted" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="course-title"
                className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5"
              >
                Titel *
              </label>
              <input
                id="course-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Figma Grundlagen Kurs"
                className="input"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="course-desc"
                className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5"
              >
                Beschreibung
              </label>
              <textarea
                id="course-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kursbeschreibung..."
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

            {/* Provider */}
            <div>
              <label
                htmlFor="course-provider"
                className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5"
              >
                Anbieter
              </label>
              <input
                id="course-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="z.B. Coursera, Intern"
                className="input"
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="course-duration"
                className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5"
              >
                Dauer (Minuten)
              </label>
              <input
                id="course-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="60"
                className="input"
                min={1}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Schwierigkeit
              </label>
              <div className="flex items-center gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all ${
                      difficulty === d.value
                        ? "bg-foreground text-white"
                        : "bg-cream-200/60 text-muted hover:bg-cream-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* External URL */}
            <div>
              <label
                htmlFor="course-url"
                className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5"
              >
                Externe URL
              </label>
              <input
                id="course-url"
                type="text"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </div>

            {/* Modules */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Module
              </label>
              <div className="space-y-3">
                {modules.map((mod, index) => (
                  <div
                    key={mod.id}
                    className="bg-cream-50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted font-medium">
                        Modul {index + 1}
                      </span>
                      <div className="flex-1" />
                      {modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModule(mod.id)}
                          className="p-1 hover:bg-cream-200 rounded transition-colors"
                          aria-label={`Modul ${index + 1} entfernen`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted hover:text-red-500" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) =>
                        updateModule(mod.id, "title", e.target.value)
                      }
                      placeholder="Modultitel"
                      className="input"
                    />
                    <input
                      type="number"
                      value={mod.estimated_minutes}
                      onChange={(e) =>
                        updateModule(
                          mod.id,
                          "estimated_minutes",
                          e.target.value
                        )
                      }
                      placeholder="Geschaetzte Minuten (optional)"
                      className="input"
                      min={1}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addModule}
                className="btn-ghost text-[13px] gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Modul hinzufuegen
              </button>
            </div>
          </div>

          {/* Validation Error */}
          {formError && (
            <div className="mx-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[13px] text-red-600">{formError}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-cream-300/50">
            <button type="button" onClick={onClose} className="btn-secondary">
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createCourse.isPending || !title.trim()}
            >
              {createCourse.isPending ? "Erstellen..." : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
