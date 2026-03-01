"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { KeyResult } from "@/types";

interface KRInlineEditProps {
  kr: KeyResult;
  onUpdate: (krId: string, newValue: number) => void;
  isUpdating?: boolean;
}

export function KRInlineEdit({ kr, onUpdate, isUpdating = false }: KRInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(String(kr.current_value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editValue when kr.current_value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(kr.current_value));
    }
  }, [kr.current_value, isEditing]);

  const handleStartEdit = () => {
    if (isUpdating) return;
    setEditValue(String(kr.current_value));
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed !== kr.current_value) {
      onUpdate(kr.id, parsed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(kr.current_value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[13px] font-medium text-foreground flex-1 truncate pr-2">
          {kr.title}
        </p>
        <div className="flex items-center gap-1.5">
          {isUpdating && (
            <Loader2
              className="h-3 w-3 text-muted animate-spin"
              aria-label="Wird aktualisiert..."
            />
          )}
          {isEditing ? (
            <span className="flex items-center gap-1 text-[11px] text-muted whitespace-nowrap">
              <input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleConfirm}
                onKeyDown={handleKeyDown}
                className="input w-16 text-center !py-0.5 !px-1.5 text-[11px]"
                step="any"
                aria-label={`${kr.title} aktueller Wert`}
              />
              <span>/ {kr.target_value}{kr.unit ? ` ${kr.unit}` : ""}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="group flex items-center gap-1 text-[11px] text-muted whitespace-nowrap hover:text-foreground transition-colors"
              aria-label={`${kr.title} Wert bearbeiten: ${kr.current_value} von ${kr.target_value}`}
              disabled={isUpdating}
            >
              <span>
                {kr.current_value}
                {kr.unit ? ` ${kr.unit}` : ""} / {kr.target_value}
                {kr.unit ? ` ${kr.unit}` : ""}
              </span>
              <Pencil
                className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
      <ProgressBar value={kr.progress} size="sm" />
    </div>
  );
}
