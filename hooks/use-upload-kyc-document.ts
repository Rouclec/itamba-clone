"use client";

import { useMutation } from "@tanstack/react-query";
import {
  uploadKycDocument,
  toBackendDocumentType,
  getAxiosErrorMessage,
  type UploadKycResult,
  type KycDocumentTypeUI,
} from "@/utils/kyc-upload";

export type UploadKycDocumentInput = {
  userId: string;
  file: File;
  documentType: KycDocumentTypeUI;
  onProgress?: (percent: number) => void;
};

async function upload({
  userId,
  file,
  documentType,
  onProgress,
}: UploadKycDocumentInput): Promise<UploadKycResult> {
  const backendType = toBackendDocumentType(documentType);
  return uploadKycDocument(userId, file, backendType, onProgress);
}

/**
 * Custom hook to upload a KYC document.
 * POSTs FormData to /v2/api/public/user/{userId}/kyc/documents/upload.
 * Maps UI document types (school_fee_receipt, student_id_card, transcript_report_card)
 * to backend types (enrollment_letter, student_id, transcript).
 */
export function useUploadKycDocument() {
  const mutation = useMutation({
    mutationFn: upload,
  });

  const uploadAsync = (
    userId: string,
    file: File,
    documentType: KycDocumentTypeUI,
    onProgress?: (percent: number) => void,
  ) =>
    mutation.mutateAsync({
      userId,
      file,
      documentType,
      onProgress,
    });

  return {
    upload: uploadAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    errorMessage: mutation.error ? getAxiosErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
