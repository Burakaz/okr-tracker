"use client";

import { useState, useMemo, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Star, Target } from "lucide-react";
import { OKRForm } from "@/components/okr/OKRForm";
import { CheckinDialog } from "@/components/okr/CheckinDialog";
import { DuplicateOKRDialog } from "@/components/okr/DuplicateOKRDialog";
import { FocusOKRSection } from "@/components/okr/FocusOKRSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuarterSelector } from "@/components/okr/QuarterSelector";
import { ScoreDashboard } from "@/components/okr/ScoreDashboard";
import { OKRAccordionItem } from "@/components/okr/OKRAccordionItem";
import { useOKRs, useCurrentUser } from "@/lib/queries";
import { useOKRsRealtime } from "@/hooks/useRealtimeQuery";
import {
  getCurrentQuarter,
  MAX_OKRS_PER_QUARTER,
  MAX_FOCUS,
} from "@/lib/okr-logic";
import type {
  OKR,
  OKRScope,
  CreateOKRRequest,
  CreateCheckinRequest,
  DuplicateOKRRequest,
} from "@/types";

export default function OKRsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <OKRsContent />
    </Suspense>
  );
}

type TabFilter = "active" | "archive";
type ScopeFilter = "all" | "personal" | "team" | "company";

function OKRsContent() {
  const queryClient = useQueryClient();

  // Quarter state is LOCAL to this page
  const [currentQuarter, setCurrentQuarter] = useState(getCurrentQuarter);

  // React Query
  const { data: okrData, isLoading: isLoadingOKRs } = useOKRs(currentQuarter);
  const { data: userData } = useCurrentUser();

  // Realtime
  useOKRsRealtime();

  const user = userData?.user || null;
  const okrs: OKR[] = okrData?.okrs || [];

  // UI state
  const [tabFilter, setTabFilter] = useState<TabFilter>("active");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinOKR, setCheckinOKR] = useState<OKR | null>(null);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateOKR, setDuplicateOKR] = useState<OKR | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "delete" | "archive";
    okr: OKR;
  } | null>(null);

  // Derived data
  const activeOKRs = useMemo(
    () => okrs.filter((o) => o.is_active),
    [okrs]
  );
  const archivedOKRs = useMemo(
    () => okrs.filter((o) => !o.is_active),
    [okrs]
  );

  const focusOKRs = useMemo(
    () => activeOKRs.filter((o) => o.is_focus),
    [activeOKRs]
  );

  // Apply tab + scope filter
  const filteredOKRs = useMemo(() => {
    const base = tabFilter === "active" ? activeOKRs : archivedOKRs;
    if (scopeFilter === "all") return base;
    return base.filter((o) => o.scope === scopeFilter);
  }, [activeOKRs, archivedOKRs, tabFilter, scopeFilter]);

  // Counts for scope pills
  const scopeCounts = useMemo(() => {
    const base = tabFilter === "active" ? activeOKRs : archivedOKRs;
    return {
      all: base.length,
      personal: base.filter((o) => o.scope === "personal").length,
      team: base.filter((o) => o.scope === "team").length,
      company: base.filter((o) => o.scope === "company").length,
    };
  }, [activeOKRs, archivedOKRs, tabFilter]);

  // Invalidate and refetch cache helper
  const invalidateOKRs = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["okrs"],
      refetchType: "all",
    });
  };

  // --- Handlers ---

  const handleNewOKR = () => {
    setEditingOKR(null);
    setShowForm(true);
  };

  const handleEditOKR = (okr: OKR) => {
    setEditingOKR(okr);
    setShowForm(true);
  };

  const handleSubmitOKR = async (data: CreateOKRRequest) => {
    setIsSubmitting(true);
    setShowForm(false);
    setEditingOKR(null);

    try {
      const url = editingOKR ? `/api/okrs/${editingOKR.id}` : "/api/okrs";
      const method = editingOKR ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editingOKR ? "OKR aktualisiert" : "OKR erstellt");
        await invalidateOKRs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckin = (okr: OKR) => {
    setCheckinOKR(okr);
    setShowCheckin(true);
  };

  const handleSubmitCheckin = async (data: CreateCheckinRequest) => {
    if (!checkinOKR) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/okrs/${checkinOKR.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Check-in gespeichert");
        setShowCheckin(false);
        setCheckinOKR(null);
        await invalidateOKRs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Check-in");
      }
    } catch {
      toast.error("Fehler beim Check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFocus = async (okr: OKR) => {
    // Prevent adding more than MAX_FOCUS
    if (!okr.is_focus && focusOKRs.length >= MAX_FOCUS) {
      toast.error(`Maximal ${MAX_FOCUS} Fokus-OKRs erlaubt`);
      return;
    }

    try {
      const res = await fetch(`/api/okrs/${okr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_focus: !okr.is_focus }),
      });

      if (res.ok) {
        toast.success(okr.is_focus ? "Fokus entfernt" : "Fokus gesetzt");
        await invalidateOKRs();
      } else {
        toast.error("Fehler beim Aktualisieren");
      }
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleArchive = (okr: OKR) => {
    setConfirmDialog({ type: "archive", okr });
  };

  const handleDelete = (okr: OKR) => {
    setConfirmDialog({ type: "delete", okr });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    const { type, okr } = confirmDialog;
    setConfirmDialog(null);

    try {
      if (type === "delete") {
        const res = await fetch(`/api/okrs/${okr.id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("OKR geloescht");
          if (expandedId === okr.id) setExpandedId(null);
          await invalidateOKRs();
        } else {
          toast.error("Loeschen fehlgeschlagen");
        }
      } else if (type === "archive") {
        const res = await fetch(`/api/okrs/${okr.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: false }),
        });
        if (res.ok) {
          toast.success("OKR archiviert");
          if (expandedId === okr.id) setExpandedId(null);
          await invalidateOKRs();
        } else {
          toast.error("Archivieren fehlgeschlagen");
        }
      }
    } catch {
      toast.error("Fehler bei der Aktion");
    }
  };

  const handleDuplicate = (okr: OKR) => {
    setDuplicateOKR(okr);
    setShowDuplicate(true);
  };

  const handleSubmitDuplicate = async (data: DuplicateOKRRequest) => {
    if (!duplicateOKR) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/okrs/${duplicateOKR.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("OKR dupliziert");
        setShowDuplicate(false);
        setDuplicateOKR(null);
        await invalidateOKRs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Duplizieren");
      }
    } catch {
      toast.error("Fehler beim Duplizieren");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Loading state
  if (isLoadingOKRs) {
    return (
      <div className="h-full overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">OKRs</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-cream-200 rounded w-24 mb-3" />
              <div className="h-8 bg-cream-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-cream-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 1. Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">OKRs</h1>
            <button onClick={handleNewOKR} className="btn-primary text-[13px] gap-1.5">
              <Plus className="h-4 w-4" aria-hidden="true" />
              OKR
            </button>
          </div>

          {/* 2. Quarter Selector */}
          <QuarterSelector
            currentQuarter={currentQuarter}
            onChange={setCurrentQuarter}
          />

          {/* 3. Score Dashboard */}
          <ScoreDashboard okrs={okrs} quarter={currentQuarter} />

          {/* 4. Dein Fokus */}
          <div>
            <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-accent-green fill-accent-green" aria-hidden="true" />
              Dein Fokus
            </h2>
            {focusOKRs.length > 0 ? (
              <FocusOKRSection
                okrs={focusOKRs}
                onSelect={(okr) => handleToggleExpand(okr.id)}
                onToggleFocus={handleToggleFocus}
              />
            ) : (
              <div className="card p-4 text-center">
                <Star className="h-5 w-5 text-cream-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-[13px] text-muted">
                  Markiere bis zu {MAX_FOCUS} OKRs als Fokus, um sie hier hervorzuheben.
                </p>
              </div>
            )}
          </div>

          {/* 5. Tab Navigation: Aktiv / Archiv */}
          <div className="flex items-center gap-1 border-b border-cream-200">
            <button
              onClick={() => setTabFilter("active")}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                tabFilter === "active"
                  ? "border-accent-green text-accent-green"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Aktiv ({activeOKRs.length})
            </button>
            <button
              onClick={() => setTabFilter("archive")}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                tabFilter === "archive"
                  ? "border-accent-green text-accent-green"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Archiv ({archivedOKRs.length})
            </button>
          </div>

          {/* 6. Scope Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(
                [
                  { key: "all", label: "Alle" },
                  { key: "personal", label: "Personal" },
                  { key: "team", label: "Team" },
                  { key: "company", label: "Company" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setScopeFilter(key)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-full transition-colors ${
                    scopeFilter === key
                      ? "bg-foreground text-white"
                      : "bg-cream-100 text-muted hover:bg-cream-200"
                  }`}
                >
                  {label}
                  {scopeCounts[key] > 0 && (
                    <span className="ml-1">({scopeCounts[key]})</span>
                  )}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-muted">
              {filteredOKRs.length}/{MAX_OKRS_PER_QUARTER} OKRs in{" "}
              {currentQuarter}
            </span>
          </div>

          {/* Screenreader announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {filteredOKRs.length === 0
              ? "Keine OKRs gefunden"
              : `${filteredOKRs.length} OKR${filteredOKRs.length !== 1 ? "s" : ""} angezeigt`}
          </div>

          {/* 7. OKR Accordion List */}
          {filteredOKRs.length > 0 ? (
            <div className="space-y-3">
              {filteredOKRs.map((okr) => (
                <OKRAccordionItem
                  key={okr.id}
                  okr={okr}
                  isExpanded={expandedId === okr.id}
                  onToggle={() => handleToggleExpand(okr.id)}
                  onCheckin={handleCheckin}
                  onEdit={handleEditOKR}
                  onFocus={handleToggleFocus}
                  onArchive={handleArchive}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" role="status">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted" aria-hidden="true" />
              </div>
              <p className="empty-state-title">
                {tabFilter === "archive"
                  ? "Kein Archiv vorhanden"
                  : "Noch keine OKRs vorhanden"}
              </p>
              <p className="empty-state-description mb-4">
                {tabFilter === "archive"
                  ? "Archivierte OKRs erscheinen hier."
                  : "Erstelle dein erstes OKR, um deine Ziele zu verfolgen."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OKR Form Modal */}
      {showForm && (
        <OKRForm
          initialData={editingOKR || undefined}
          currentQuarter={currentQuarter}
          onSubmit={handleSubmitOKR}
          onCancel={() => {
            setShowForm(false);
            setEditingOKR(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Check-in Dialog */}
      {showCheckin && checkinOKR && (
        <CheckinDialog
          okr={checkinOKR}
          onSubmit={handleSubmitCheckin}
          onCancel={() => {
            setShowCheckin(false);
            setCheckinOKR(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Duplicate Dialog */}
      {showDuplicate && duplicateOKR && (
        <DuplicateOKRDialog
          okr={duplicateOKR}
          onSubmit={handleSubmitDuplicate}
          onCancel={() => {
            setShowDuplicate(false);
            setDuplicateOKR(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={
          confirmDialog?.type === "delete"
            ? "OKR loeschen"
            : "OKR archivieren"
        }
        description={
          confirmDialog?.type === "delete"
            ? `"${confirmDialog?.okr.title}" wird unwiderruflich geloescht. Alle Check-ins und Key Results gehen verloren.`
            : `"${confirmDialog?.okr.title}" wird archiviert und kann spaeter wiederhergestellt werden.`
        }
        confirmLabel={
          confirmDialog?.type === "delete" ? "Loeschen" : "Archivieren"
        }
        variant={confirmDialog?.type === "delete" ? "danger" : "default"}
        icon={confirmDialog?.type === "delete" ? "delete" : "warning"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
