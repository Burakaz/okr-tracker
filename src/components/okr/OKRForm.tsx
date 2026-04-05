"use client";

import { useCallback, useEffect } from "react";
import type { OKR, CreateOKRRequest } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { OKRFormFields } from "./OKRFormFields";

interface OKRFormProps {
  initialData?: OKR;
  currentQuarter?: string;
  onSubmit: (data: CreateOKRRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OKRForm({
  initialData,
  currentQuarter,
  onSubmit,
  onCancel,
  isLoading = false,
}: OKRFormProps) {
  const focusTrapRef = useFocusTrap();

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

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="okr-form-title"
    >
      <div
        ref={focusTrapRef}
        className="modal-content"
        style={{ maxWidth: "32rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <OKRFormFields
          initialData={initialData}
          currentQuarter={currentQuarter}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          layout="modal"
        />
      </div>
    </div>
  );
}
