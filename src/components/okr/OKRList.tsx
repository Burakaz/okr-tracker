"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Pencil,
  Star,
  Copy,
  Archive,
  Trash2,
  ArrowUpDown,
  Target,
  TrendingUp,
  Wrench,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { OKR, OKRCategory, OKRFilterType } from "@/types";

type SortField = "title" | "category" | "progress" | "score" | "status" | "due_date";
type SortDirection = "asc" | "desc";

interface OKRListProps {
  okrs: OKR[];
  selectedId?: string;
  activeFilter?: OKRFilterType;
  onSelect: (okr: OKR) => void;
  onEdit: (okr: OKR) => void;
  onFocus: (okr: OKR) => void;
  onArchive: (okr: OKR) => void;
  onDuplicate: (okr: OKR) => void;
  onDelete: (okr: OKR) => void;
}

const emptyStateConfig: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  all: {
    icon: <Target className="w-8 h-8 text-muted" />,
    title: "Noch keine OKRs vorhanden",
    description: "Erstelle dein erstes OKR, um deine Ziele zu verfolgen.",
  },
  performance: {
    icon: <TrendingUp className="w-8 h-8 text-muted" />,
    title: "Keine Performance-OKRs",
    description: "Erstelle ein Performance-OKR, um KPIs wie ROAS, CPA, CTR oder Conversion Rate zu tracken.",
  },
  skill: {
    icon: <Wrench className="w-8 h-8 text-muted" />,
    title: "Keine Skill-OKRs",
    description: "Erstelle ein Skill-OKR f\u00fcr Tool-Beherrschung, Zertifizierungen oder neue Strategien, die du testen m\u00f6chtest.",
  },
  learning: {
    icon: <BookOpen className="w-8 h-8 text-muted" />,
    title: "Keine Learning-OKRs",
    description: "Erstelle ein Learning-OKR f\u00fcr Kurse, Weiterbildungen, Konferenzen oder Wissenstransfers innerhalb des Teams.",
  },
  career: {
    icon: <Briefcase className="w-8 h-8 text-muted" />,
    title: "Keine Karriere-OKRs",
    description: "Erstelle ein Karriere-OKR f\u00fcr Projekte, Teamf\u00fchrung, Kundenpr\u00e4sentationen oder Verantwortungsbereiche.",
  },
  focus: {
    icon: <Star className="w-8 h-8 text-muted" />,
    title: "Keine Fokus-OKRs gesetzt",
    description: "Setze bis zu 2 OKRs als Fokus, um sie oben in der \u00dcbersicht hervorzuheben.",
  },
  archive: {
    icon: <Archive className="w-8 h-8 text-muted" />,
    title: "Kein Archiv vorhanden",
    description: "Archivierte OKRs erscheinen hier. Du kannst OKRs \u00fcber das Aktionsmen\u00fc archivieren.",
  },
};

const categoryConfig: Record<OKRCategory, { label: string; colorClass: string }> = {
  performance: { label: "Performance", colorClass: "badge-blue" },
  skill: { label: "Skill", colorClass: "badge-yellow" },
  learning: { label: "Learning", colorClass: "badge-green" },
  career: { label: "Karriere", colorClass: "badge-gray" },
};

function getCategoryClassName(category: OKRCategory): string {
  return categoryConfig[category]?.colorClass || "badge-gray";
}

/** Calculate a 0-1 score from progress (0-100) */
function calculateScore(okr: OKR): number {
  return okr.progress / 100;
}

export function OKRList({
  okrs,
  selectedId,
  activeFilter = "all",
  onSelect,
  onEdit,
  onFocus,
  onArchive,
  onDuplicate,
  onDelete,
}: OKRListProps) {
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Separate focus OKRs from the rest, then sort
  const focusOkrs = okrs.filter((o) => o.is_focus);
  const nonFocusOkrs = okrs.filter((o) => !o.is_focus);

  const sortItems = (items: OKR[]): OKR[] => {
    return [...items].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        case "progress":
          return (a.progress - b.progress) * dir;
        case "score":
          return (calculateScore(a) - calculateScore(b)) * dir;
        case "status": {
          const statusOrder = { on_track: 0, at_risk: 1, off_track: 2 };
          return (statusOrder[a.status] - statusOrder[b.status]) * dir;
        }
        case "due_date": {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return (dateA - dateB) * dir;
        }
        default:
          return 0;
      }
    });
  };

  const sortedFocusOkrs = sortItems(focusOkrs);
  const sortedNonFocusOkrs = sortItems(nonFocusOkrs);
  const allSorted = [...sortedFocusOkrs, ...sortedNonFocusOkrs];

  if (okrs.length === 0) {
    const config = emptyStateConfig[activeFilter] || emptyStateConfig.all;
    return (
      <div className="empty-state" role="status">
        <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
          {config.icon}
        </div>
        <p className="empty-state-title">{config.title}</p>
        <p className="empty-state-description mb-4">
          {config.description}
        </p>
      </div>
    );
  }

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      scope="col"
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
      aria-sort={sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      role="columnheader"
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 w-full text-left bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit uppercase text-[0.75rem] tracking-[0.025em]"
        onClick={(e) => {
          e.stopPropagation();
          handleSort(field);
        }}
        aria-label={`Sortieren nach ${label}`}
      >
        {label}
        {sortField === field && (
          <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
    </th>
  );

  return (
    <div className="card mx-6 mt-4 overflow-hidden">
      <table className="table" aria-label="OKR-Übersicht">
        <thead>
          <tr>
            <SortHeader field="title" label="Titel" />
            <SortHeader field="category" label="Kategorie" />
            <SortHeader field="progress" label="Fortschritt" />
            <SortHeader field="score" label="Score" />
            <SortHeader field="status" label="Status" />
            <SortHeader field="due_date" label="Fällig" />
            <th className="w-10" scope="col"><span className="sr-only">Aktionen</span></th>
          </tr>
        </thead>
        <tbody>
          {allSorted.map((okr) => (
            <tr
              key={okr.id}
              onClick={() => onSelect(okr)}
              className={`cursor-pointer transition-colors hover:bg-cream-50 ${
                selectedId === okr.id ? "bg-cream-100" : ""
              } ${okr.is_focus ? "border-l-4 border-l-accent-green" : ""}`}
            >
              <td>
                <div className="flex items-center gap-2">
                  {okr.is_focus && (
                    <Star className="h-3.5 w-3.5 text-accent-green fill-accent-green flex-shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate max-w-[250px]">
                    {okr.title}
                  </span>
                </div>
              </td>
              <td>
                <span className={`badge ${getCategoryClassName(okr.category)}`}>
                  {categoryConfig[okr.category]?.label}
                </span>
              </td>
              <td>
                <ProgressBar value={okr.progress} size="sm" showLabel className="w-24" />
              </td>
              <td>
                <ScoreBadge score={calculateScore(okr)} />
              </td>
              <td>
                <StatusBadge status={okr.status} />
              </td>
              <td>
                <span className="text-[13px] text-muted">
                  {okr.due_date
                    ? new Date(okr.due_date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "-"}
                </span>
              </td>
              <td>
                <div className="relative" ref={openMenuId === okr.id ? menuRef : undefined}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === okr.id ? null : okr.id);
                    }}
                    className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
                    aria-label="Aktionen"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted" />
                  </button>

                  {openMenuId === okr.id && (
                    <div className="dropdown-menu" role="menu" aria-label="OKR-Aktionen">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onEdit(okr);
                        }}
                        className="dropdown-item w-full text-[13px]"
                        role="menuitem"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Bearbeiten
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onFocus(okr);
                        }}
                        className="dropdown-item w-full text-[13px]"
                        role="menuitem"
                      >
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        {okr.is_focus ? "Fokus entfernen" : "Fokus setzen"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDuplicate(okr);
                        }}
                        className="dropdown-item w-full text-[13px]"
                        role="menuitem"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Duplizieren
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onArchive(okr);
                        }}
                        className="dropdown-item w-full text-[13px]"
                        role="menuitem"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        Archivieren
                      </button>
                      <div className="border-t border-cream-300/50 my-0.5" role="separator" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDelete(okr);
                        }}
                        className="dropdown-item-danger w-full text-[13px]"
                        role="menuitem"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
