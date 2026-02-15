"use client";

import { useState, useMemo, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { OKRList } from "@/components/okr/OKRList";
import { OKRDetail } from "@/components/okr/OKRDetail";
import { OKRForm } from "@/components/okr/OKRForm";
import { CheckinDialog } from "@/components/okr/CheckinDialog";
import { DuplicateOKRDialog } from "@/components/okr/DuplicateOKRDialog";
import { FocusOKRSection } from "@/components/okr/FocusOKRSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OKRListSkeleton } from "@/components/ui/Skeleton";
import { useDashboardFilter } from "@/components/layout/DashboardClientWrapper";
import { useOKRs, useCurrentUser } from "@/lib/queries";
import { useOKRsRealtime } from "@/hooks/useRealtimeQuery";
import type { OKR, CreateOKRRequest, CreateCheckinRequest, DuplicateOKRRequest } from "@/types";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const queryClient = useQueryClient();
  const { activeFilter, currentQuarter } = useDashboardFilter();

  // React Query for data
  const { data: okrData, isLoading: isLoadingOKRs } = useOKRs(currentQuarter);
  const { data: userData } = useCurrentUser();

  // Realtime subscription - auto-invalidates React Query cache when DB changes
  useOKRsRealtime();

  const user = userData?.user || null;
  const okrs: OKR[] = okrData?.okrs || [];

  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinOKR, setCheckinOKR] = useState<OKR | null>(null);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateOKR, setDuplicateOKR] = useState<OKR | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "delete" | "archive";
    okr: OKR;
  } | null>(null);

  // Client-side filtering based on activeFilter + search
  const filteredOKRs = useMemo(() => {
    let result = okrs;

    // Filter by category/type (from Sidebar)
    switch (activeFilter) {
      case "performance":
        result = result.filter((o) => o.category === "performance");
        break;
      case "skill":
        result = result.filter((o) => o.category === "skill");
        break;
      case "learning":
        result = result.filter((o) => o.category === "learning");
        break;
      case "career":
        result = result.filter((o) => o.category === "career");
        break;
      case "focus":
        result = result.filter((o) => o.is_focus);
        break;
      case "archive":
        result = result.filter((o) => !o.is_active);
        break;
      case "all":
      default:
        result = result.filter((o) => o.is_active);
        break;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(query) ||
          (o.why_it_matters && o.why_it_matters.toLowerCase().includes(query))
      );
    }

    return result;
  }, [okrs, activeFilter, searchQuery]);

  // Focus OKRs (only in "all" view)
  const focusOKRs = useMemo(() => {
    if (activeFilter !== "all") return [];
    return okrs.filter((o) => o.is_focus && o.is_active);
  }, [okrs, activeFilter]);

  // Invalidate and refetch cache helper
  const invalidateOKRs = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["okrs"],
      refetchType: "all",
    });
  };

  // --- Handlers ---

  const handleSelectOKR = (okr: OKR) => {
    if (selectedOKR?.id === okr.id && showDetail) {
      setShowDetail(false);
    } else {
      setSelectedOKR(okr);
      setShowDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

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
          toast.success("OKR gelöscht");
          if (selectedOKR?.id === okr.id) {
            setSelectedOKR(null);
            setShowDetail(false);
          }
          await invalidateOKRs();
        } else {
          toast.error("Löschen fehlgeschlagen");
        }
      } else if (type === "archive") {
        const res = await fetch(`/api/okrs/${okr.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: false }),
        });
        if (res.ok) {
          toast.success("OKR archiviert");
          if (selectedOKR?.id === okr.id) {
            setSelectedOKR(null);
            setShowDetail(false);
          }
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

  // Loading state
  if (isLoadingOKRs) {
    return (
      <div className="h-full flex flex-col">
        <Header
          user={user || { id: "", email: "", name: "Loading...", role: "employee", status: "active", department: null, manager_id: null, career_level_id: null, organization_id: null, avatar_url: null, created_at: "", updated_at: "" }}
          currentQuarter={currentQuarter}
          onSearch={setSearchQuery}
          onNewItem={() => {}}
        />
        <div className="flex-1 overflow-y-auto">
          <OKRListSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="sr-only">OKR Dashboard</h1>
      <Header
        user={user || { id: "", email: "", name: "Loading...", role: "employee", status: "active", department: null, manager_id: null, career_level_id: null, organization_id: null, avatar_url: null, created_at: "", updated_at: "" }}
        currentQuarter={currentQuarter}
        onSearch={setSearchQuery}
        onNewItem={handleNewOKR}
        onCheckin={selectedOKR ? () => handleCheckin(selectedOKR) : undefined}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Screenreader-Ankündigung für dynamische Änderungen */}
        <div className="sr-only" aria-live="polite" aria-atomic="true" id="okr-status">
          {filteredOKRs.length === 0
            ? "Keine OKRs gefunden"
            : `${filteredOKRs.length} OKR${filteredOKRs.length !== 1 ? "s" : ""} angezeigt`}
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Focus OKRs at top */}
          <FocusOKRSection
            okrs={focusOKRs}
            onSelect={handleSelectOKR}
            onToggleFocus={handleToggleFocus}
          />

          {/* OKR List */}
          <OKRList
            okrs={filteredOKRs}
            selectedId={showDetail ? selectedOKR?.id : undefined}
            activeFilter={activeFilter}
            onSelect={handleSelectOKR}
            onEdit={handleEditOKR}
            onFocus={handleToggleFocus}
            onArchive={handleArchive}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>

        {/* Detail Panel - Slide in from right */}
        <div
          className={`absolute top-0 right-0 h-full w-[520px] bg-white border-l border-cream-300 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
            showDetail && selectedOKR ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedOKR && (
            <OKRDetail
              okr={selectedOKR}
              onClose={handleCloseDetail}
              onEdit={() => handleEditOKR(selectedOKR)}
              onCheckin={() => handleCheckin(selectedOKR)}
              onArchive={() => handleArchive(selectedOKR)}
              onDuplicate={() => handleDuplicate(selectedOKR)}
              onDelete={() => handleDelete(selectedOKR)}
            />
          )}
        </div>

        {/* Overlay when detail is open */}
        {showDetail && selectedOKR && (
          <div
            className="absolute inset-0 bg-black/5 z-10 lg:hidden"
            onClick={handleCloseDetail}
            aria-hidden="true"
          />
        )}
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
            ? "OKR löschen"
            : "OKR archivieren"
        }
        description={
          confirmDialog?.type === "delete"
            ? `"${confirmDialog?.okr.title}" wird unwiderruflich gelöscht. Alle Check-ins und Key Results gehen verloren.`
            : `"${confirmDialog?.okr.title}" wird archiviert und kann später wiederhergestellt werden.`
        }
        confirmLabel={
          confirmDialog?.type === "delete" ? "Löschen" : "Archivieren"
        }
        variant={confirmDialog?.type === "delete" ? "danger" : "default"}
        icon={confirmDialog?.type === "delete" ? "delete" : "warning"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
