import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/inteceptor";
import type { DocumentDetails } from "@/lib/document-details-types";

export async function fetchDocumentDetails(
  documentId: string
): Promise<DocumentDetails | null> {
  const response = await axiosInstance.get<DocumentDetails>(
    "/documents/materials",
    { params: { doc_id: documentId } }
  );
  return response.data ?? null;
}

const DOCUMENT_DETAILS_STALE_TIME_MS = 2 * 60 * 1000; // 2 minutes

export function useGetDocumentDetails(documentId: string | null) {
  return useQuery({
    queryKey: ["document-details", documentId],
    queryFn: () => fetchDocumentDetails(documentId!),
    enabled: !!documentId,
    staleTime: DOCUMENT_DETAILS_STALE_TIME_MS,
  });
}
