"use client";

import { useEffect, useCallback } from "react";
import { AlertTriangle, ArrowRightLeft, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  icon?: "transfer" | "delete" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

const icons = {
  transfer: <ArrowRightLeft className="h-6 w-6 text-blue-600" />,
  delete: <Trash2 className="h-6 w-6 text-red-600" />,
  warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
};

const iconBgs = {
  transfer: "bg-blue-50",
  delete: "bg-red-50",
  warning: "bg-amber-50",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  variant = "default",
  icon = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${iconBgs[icon]} mb-4`}>
            {icons[icon]}
          </div>

          {/* Title */}
          <h3 id="confirm-dialog-title" className="text-lg font-semibold text-foreground mb-1.5">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary py-2.5 text-sm font-medium"
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
