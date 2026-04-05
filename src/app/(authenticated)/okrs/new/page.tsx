"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OKRFormFields } from "@/components/okr/OKRFormFields";
import { getCurrentQuarter } from "@/lib/okr-logic";
import type { CreateOKRRequest } from "@/types";

export default function NewOKRPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateOKRRequest) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("OKR erstellt");
        await queryClient.invalidateQueries({
          queryKey: ["okrs"],
          refetchType: "all",
        });
        router.push("/okrs");
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Erstellen");
      }
    } catch {
      toast.error("Fehler beim Erstellen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Breadcrumb header */}
      <div className="border-b border-cream-300/50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/okrs"
            className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
            aria-label="Zurück zu Ziele"
          >
            <ArrowLeft className="h-5 w-5 text-muted" />
          </Link>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Link href="/okrs" className="hover:text-foreground transition-colors">
              Ziele
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Neues OKR</span>
          </div>
        </div>
      </div>

      <OKRFormFields
        currentQuarter={getCurrentQuarter()}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/okrs")}
        isLoading={isSubmitting}
        layout="page"
      />
    </div>
  );
}
