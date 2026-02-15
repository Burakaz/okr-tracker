"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  ChevronRight,
  Loader2,
  Target,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import type { OKR } from "@/types";

const categoryLabels: Record<string, { label: string; className: string }> = {
  performance: { label: "Performance", className: "badge-blue" },
  skill: { label: "Skill", className: "badge-yellow" },
  learning: { label: "Learning", className: "badge-green" },
  career: { label: "Karriere", className: "badge-gray" },
};

export default function TrashPage() {
  const [archivedOKRs, setArchivedOKRs] = useState<OKR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadArchived = async () => {
    try {
      const res = await fetch("/api/okrs?archived=true");
      if (!res.ok) return;
      const data = await res.json();
      const archived = (data.okrs || []).filter((o: OKR) => !o.is_active);
      setArchivedOKRs(archived);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, []);

  const handleRestore = async () => {
    if (!restoreId) return;
    setIsRestoring(true);

    try {
      const res = await fetch(`/api/okrs/${restoreId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });

      if (res.ok) {
        toast.success("OKR wiederhergestellt");
        setArchivedOKRs((prev) => prev.filter((o) => o.id !== restoreId));
      } else {
        toast.error("Wiederherstellen fehlgeschlagen");
      }
    } catch {
      toast.error("Fehler beim Wiederherstellen");
    } finally {
      setRestoreId(null);
      setIsRestoring(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b border-cream-300/50">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Admin</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Papierkorb</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-cream-100 border border-cream-300/50 rounded-xl mb-6">
            <AlertTriangle className="h-5 w-5 text-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Archivierte OKRs</p>
              <p className="text-xs text-muted mt-0.5">
                Hier findest du alle archivierten OKRs. Du kannst sie wiederherstellen, um sie erneut zu aktivieren.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : archivedOKRs.length === 0 ? (
            <div className="empty-state" role="status">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-muted" />
              </div>
              <p className="empty-state-title">Papierkorb ist leer</p>
              <p className="empty-state-description">
                Keine archivierten OKRs vorhanden.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">OKR</th>
                    <th scope="col">Kategorie</th>
                    <th scope="col">Quartal</th>
                    <th scope="col">Score</th>
                    <th scope="col">Archiviert am</th>
                    <th scope="col" className="w-10">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {archivedOKRs.map((okr) => (
                    <tr key={okr.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted flex-shrink-0" />
                          <span className="font-medium text-foreground text-[13px] truncate max-w-[250px]">
                            {okr.title}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${categoryLabels[okr.category]?.className || "badge-gray"} text-[11px]`}>
                          {categoryLabels[okr.category]?.label || okr.category}
                        </span>
                      </td>
                      <td>
                        <span className="text-[13px] text-muted">{okr.quarter}</span>
                      </td>
                      <td>
                        <ScoreBadge score={okr.progress / 100} />
                      </td>
                      <td>
                        <span className="text-[13px] text-muted">
                          {new Date(okr.updated_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setRestoreId(okr.id)}
                          className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
                          aria-label={`OKR "${okr.title}" wiederherstellen`}
                          title="Wiederherstellen"
                        >
                          <RotateCcw className="h-4 w-4 text-accent-green" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!restoreId}
        title="OKR wiederherstellen"
        description="Dieses OKR wird wiederhergestellt und erscheint wieder in der aktiven Ansicht."
        confirmLabel="Wiederherstellen"
        variant="default"
        icon="warning"
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
    </div>
  );
}
