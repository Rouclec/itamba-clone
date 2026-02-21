import { axiosMultipart } from "@/utils/inteceptor";
import { getAxiosErrorMessage } from "@/utils/axios-error";

export interface UploadKycResult {
  url: string;
}

/** UI document type (matches document-upload StudentDocumentType). */
export type KycDocumentTypeUI =
  | "school_fee_receipt"
  | "student_id_card"
  | "transcript_report_card";

/** Backend document_type values sent to the API. */
export type KycDocumentTypeBackend =
  | "school_fee_receipt"
  | "student_id"
  | "transcript"
  | "enrollment_letter"
  | "passport"
  | "national_id";

const KYC_UPLOAD_URL = "/v2/api/public/user";

/**
 * Map UI document type to backend document_type (pass-through for matching values).
 */
export function toBackendDocumentType(
  uiType: KycDocumentTypeUI,
): KycDocumentTypeBackend {
  const map: Record<KycDocumentTypeUI, KycDocumentTypeBackend> = {
    school_fee_receipt: "school_fee_receipt",
    student_id_card: "student_id",
    transcript_report_card: "transcript",
  };
  return map[uiType];
}

/**
 * Upload a KYC document file. Returns the document URL on success.
 * Uses multipart/form-data with document_type and kyc_document.
 * Reports upload progress via onProgress(0-100).
 */
export async function uploadKycDocument(
  userId: string,
  file: File,
  documentType: KycDocumentTypeBackend,
  onProgress?: (percent: number) => void,
): Promise<UploadKycResult> {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("kyc_document", file);

  const url = `${KYC_UPLOAD_URL}/${userId}/kyc/documents/upload`;

  const response = await axiosMultipart.post<{ url?: string }>(url, formData, {
    onUploadProgress: (ev) => {
      if (ev.total != null && ev.total > 0 && onProgress) {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        onProgress(Math.min(percent, 100));
      }
    },
  });

  const resultUrl = response.data?.url;
  if (!resultUrl || typeof resultUrl !== "string") {
    throw new Error("Upload did not return a document URL");
  }
  return { url: resultUrl };
}

export { getAxiosErrorMessage };
