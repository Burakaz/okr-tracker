"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  User,
  Briefcase,
  Award,
  Crown,
  Star,
  Check,
} from "lucide-react";

interface CareerLevelItem {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
}

const CAREER_LEVELS: CareerLevelItem[] = [
  {
    id: "trainee",
    name: "Trainee",
    description: "Einstieg ins Unternehmen mit strukturiertem Onboarding-Programm.",
    requirements: [
      "Grundlagenwissen aufbauen",
      "Onboarding abschliessen",
      "Erste OKRs definieren",
    ],
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: "junior",
    name: "Junior",
    description: "Selbststandige Arbeit an definierten Aufgaben unter Anleitung.",
    requirements: [
      "2 OKRs mit Score >= 0.7",
      "Grundlegende Fachkenntnisse nachweisen",
      "Eigenstandige Aufgabenbearbeitung",
    ],
    icon: <User className="h-4 w-4" />,
  },
  {
    id: "midlevel",
    name: "Midlevel",
    description: "Erfahrene Fachkraft mit eigenverantwortlicher Projektarbeit.",
    requirements: [
      "3 OKRs mit Score >= 0.7",
      "Projektverantwortung ubernehmen",
      "Mentoring von Junioren",
      "Fachliche Expertise vertiefen",
    ],
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: "senior",
    name: "Senior",
    description: "Strategische Verantwortung und Fuhrung in Fachthemen.",
    requirements: [
      "4 OKRs mit Score >= 0.7",
      "Strategische Projekte leiten",
      "Team-Mentoring",
      "Fachliche Fuhrung ubernehmen",
    ],
    icon: <Award className="h-4 w-4" />,
  },
  {
    id: "lead",
    name: "Lead",
    description: "Teamfuhrung und strategische Verantwortung fur einen Bereich.",
    requirements: [
      "4 OKRs mit Score >= 0.7",
      "Teamfuhrung nachweisen",
      "Bereichsstrategie entwickeln",
      "Budget-Verantwortung",
      "Cross-funktionale Zusammenarbeit",
    ],
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: "head",
    name: "Head",
    description: "Abteilungsleitung mit Gesamtverantwortung fur Strategie und Ergebnisse.",
    requirements: [
      "4 OKRs mit Score >= 0.7",
      "Abteilungsstrategie definieren",
      "Fuhrungsteam aufbauen",
      "Unternehmensweite Initiativen steuern",
      "P&L-Verantwortung",
    ],
    icon: <Crown className="h-4 w-4" />,
  },
];

interface CareerLadderProps {
  currentLevelId?: string | null;
}

export function CareerLadder({ currentLevelId }: CareerLadderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Determine the current level index based on ID or default to a placeholder
  const currentIndex = currentLevelId
    ? CAREER_LEVELS.findIndex((l) => l.id === currentLevelId)
    : 1; // Default to "Junior" for placeholder

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-2">
      {CAREER_LEVELS.map((level, index) => {
        const isCurrentLevel = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isFuture = index > currentIndex;
        const isExpanded = expandedId === level.id;

        return (
          <div key={level.id}>
            <button
              onClick={() => toggleExpand(level.id)}
              className={`card card-hover w-full text-left p-4 transition-all ${
                isCurrentLevel
                  ? "ring-2 ring-accent-green ring-offset-2"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Level indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-accent-green text-white"
                      : isCurrentLevel
                        ? "bg-accent-greenLight text-accent-green"
                        : "bg-cream-200 text-muted"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    level.icon
                  )}
                </div>

                {/* Level info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[13px] font-semibold ${
                        isFuture ? "text-muted" : "text-foreground"
                      }`}
                    >
                      {level.name}
                    </span>
                    {isCurrentLevel && (
                      <span className="badge badge-green">Aktuell</span>
                    )}
                    {isCompleted && (
                      <span className="badge badge-gray">Abgeschlossen</span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted truncate">
                    {level.description}
                  </p>
                </div>

                {/* Expand icon */}
                <div className="flex-shrink-0 text-muted">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded requirements */}
            {isExpanded && (
              <div className="ml-12 mt-2 mb-2 p-3 bg-cream-50 rounded-lg border border-cream-300/50">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                  Anforderungen
                </p>
                <ul className="space-y-1.5">
                  {level.requirements.map((req, reqIdx) => (
                    <li
                      key={reqIdx}
                      className="flex items-start gap-2 text-[12px]"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCompleted
                            ? "bg-accent-green text-white"
                            : "bg-cream-200 text-muted"
                        }`}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={
                          isCompleted ? "text-muted line-through" : "text-foreground"
                        }
                      >
                        {req}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connector line between levels */}
            {index < CAREER_LEVELS.length - 1 && (
              <div className="flex justify-start ml-[22px] my-0.5">
                <div
                  className={`w-0.5 h-3 rounded-full ${
                    isCompleted ? "bg-accent-green" : "bg-cream-300"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
