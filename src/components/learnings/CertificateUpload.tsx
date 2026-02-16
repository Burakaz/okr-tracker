"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useUploadCertificate } from "@/lib/queries";
import { toast } from "sonner";
import type { Certificate } from "@/types";

interface CertificateUploadProps {
  enrollmentId: string;
  certificates: Certificate[];
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function CertificateUpload({
  enrollmentId,
  certificates,
}: CertificateUploadProps) {
  const uploadMutation = useUploadCertificate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Nur PDF, PNG oder JPG Dateien sind erlaubt");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Datei darf maximal 10MB gross sein");
      return;
    }

    setUploadingFile(file.name);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMutation.mutateAsync({ enrollmentId, formData });
      toast.success("Zertifikat hochgeladen");
    } catch {
      toast.error("Fehler beim Hochladen des Zertifikats");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Existing certificates */}
      {certificates.length > 0 && (
        <div className="space-y-2">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 p-2.5 bg-cream-50 rounded-lg"
            >
              <FileText className="h-4 w-4 text-muted flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {cert.file_name}
                </p>
                <p className="text-[11px] text-muted">
                  {new Date(cert.uploaded_at).toLocaleDateString("de-DE")}
                </p>
              </div>
              <a
                href={cert.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-blue-600 hover:underline flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                Herunterladen
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Zertifikat hochladen per Drag & Drop oder Klick"
      >
        {uploadingFile ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 text-muted animate-spin" aria-hidden="true" />
            <p className="text-[13px] text-foreground">{uploadingFile}</p>
            <p className="text-[11px] text-muted">Wird hochgeladen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted" aria-hidden="true" />
            <p className="text-[13px] text-foreground">
              Zertifikat hochladen
            </p>
            <p className="text-[11px] text-muted">
              PDF, PNG oder JPG (max. 10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
