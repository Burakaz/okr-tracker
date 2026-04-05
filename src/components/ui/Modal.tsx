"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Title shown in the header. Pass null to render no header. */
  title?: string | null;
  subtitle?: string;
  titleId?: string;
  /** "default" = 28rem, "wide" = 36rem, "custom" = no max-width constraint */
  size?: "default" | "wide" | "custom";
  className?: string;
  style?: React.CSSProperties;
}

export function Modal({
  onClose,
  children,
  title,
  subtitle,
  titleId = "modal-title",
  size = "default",
  className,
  style,
}: ModalProps) {
  const focusTrapRef = useFocusTrap();

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

  const sizeClass =
    size === "wide"
      ? "modal-content-wide"
      : size === "custom"
        ? ""
        : "modal-content";

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title !== null ? titleId : undefined}
    >
      <div
        ref={focusTrapRef}
        className={sizeClass + (className ? ` ${className}` : "")}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== null && title !== undefined && (
          <div className="flex items-center justify-between p-6 border-b border-cream-300/50">
            <div>
              <h2
                id={titleId}
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-[13px] text-muted truncate max-w-[300px]">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
              aria-label="Schliessen"
            >
              <X className="h-5 w-5 text-muted" aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="p-6 space-y-5">{children}</div>;
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 border-t border-cream-300/50">
      {children}
    </div>
  );
}
