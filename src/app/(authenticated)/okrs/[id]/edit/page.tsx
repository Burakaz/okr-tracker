"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { OKRFormFields } from "@/components/okr/OKRFormFields";
import { useOKR } from "@/lib/queries";
import type { CreateOKRRequest } from "@/types";

export default function EditOKRPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isError } = useOKR(id);
  const okr = data?.okr;

  const handleSubmit = async (data: CreateOKRRequest) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/okrs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("OKR aktualisiert");
        await queryClient.invalidateQueries({
          queryKey: ["okrs"],
          refetchType: "all",
        });
        router.push("/okrs");
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Breadcrumb header */}
      <div className="border-b border-cream-300/50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/okrs"
            className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors"
            aria-label="Zurueck zu Ziele"
          >
            <ArrowLeft className="h-5 w-5 text-muted" />
          </Link>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Link href="/okrs" className="hover:text-foreground transition-colors">
              Ziele
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Bearbeiten</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[15px] text-muted">OKR nicht gefunden</p>
          <Link href="/okrs" className="btn-secondary text-[13px]">
            Zurueck zu Ziele
          </Link>
        </div>
      )}

      {/* Form */}
      {okr && !isLoading && (
        <OKRFormFields
          initialData={okr}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/okrs")}
          isLoading={isSubmitting}
          layout="page"
        />
      )}
    </div>
  );
}
