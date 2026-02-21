"use client";

import { useRef, useCallback } from "react";
import { CloudUpload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type StudentDocumentType =
  | "school_fee_receipt"
  | "student_id_card"
  | "transcript_report_card";

const DOCUMENT_TYPE_KEYS: Record<
  StudentDocumentType,
  string
> = {
  school_fee_receipt: "studentProfile.schoolFeeReceipt",
  student_id_card: "studentProfile.studentIdCard",
  transcript_report_card: "studentProfile.transcriptReportCard",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentUploadProps {
  documentType: StudentDocumentType;
  onDocumentTypeChange: (type: StudentDocumentType) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  progress?: number; // 0–100, optional upload progress
  t: (key: string) => string;
  disabled?: boolean;
  error?: string;
}

export function DocumentUpload({
  documentType,
  onDocumentTypeChange,
  file,
  onFileChange,
  progress,
  t,
  disabled,
  error,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(f.type)) {
      return "JPG, PNG or PDF only";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return "File size must be 10MB or less";
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (selected: File | null) => {
      if (!selected) {
        onFileChange(null);
        return;
      }
      const err = validateFile(selected);
      if (err) {
        onFileChange(null);
        return;
      }
      onFileChange(selected);
    },
    [onFileChange, validateFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
  };

  const types: StudentDocumentType[] = [
    "school_fee_receipt",
    "student_id_card",
    "transcript_report_card",
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        {t("studentProfile.selectDocumentToUpload")}
        <span className="text-destructive ml-1">*</span>
      </label>

      {/* Document type chips */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => !disabled && onDocumentTypeChange(type)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              documentType === type
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-muted-foreground hover:border-primary/50",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {t(DOCUMENT_TYPE_KEYS[type])}
          </button>
        ))}
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 py-8 px-4 transition-colors",
          !file && "hover:border-primary/50",
          error && "border-destructive",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <CloudUpload className="size-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground text-center">
          {t("studentProfile.dragAndDropOrSelect")}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          {t("studentProfile.fileConstraints")}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="border-primary text-primary bg-white hover:bg-primary/5"
          >
            {t("studentProfile.selectDocument")}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      {/* Upload progress */}
      {progress !== undefined && progress > 0 && (
        <div className="space-y-1">
          <Progress className="h-2 w-full" value={progress} />
        </div>
      )}

      {/* Selected file */}
      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <FileText className="size-8 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={disabled}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("studentProfile.remove")}
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
