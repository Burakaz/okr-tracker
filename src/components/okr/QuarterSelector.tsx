"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCurrentQuarter,
  getNextQuarter,
  getPreviousQuarter,
} from "@/lib/okr-logic";

interface QuarterSelectorProps {
  currentQuarter: string;
  onChange: (quarter: string) => void;
}

export function QuarterSelector({
  currentQuarter,
  onChange,
}: QuarterSelectorProps) {
  const isCurrentQuarter = currentQuarter === getCurrentQuarter();

  const handlePrev = () => {
    onChange(getPreviousQuarter(currentQuarter));
  };

  const handleNext = () => {
    onChange(getNextQuarter(currentQuarter));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrev}
        className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
        aria-label="Vorheriges Quartal"
      >
        <ChevronLeft className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>

      <span
        className={`text-sm font-semibold px-3 py-1.5 rounded-lg select-none ${
          isCurrentQuarter
            ? "bg-accent-green/10 text-accent-green"
            : "bg-cream-100 text-foreground"
        }`}
      >
        {currentQuarter}
      </span>

      <button
        onClick={handleNext}
        className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
        aria-label="Naechstes Quartal"
      >
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>
    </div>
  );
}
