/**
 * V1 document API: POST /documents (create), PATCH /documents/:id (update)
 */

import axiosInstance from '@/utils/inteceptor'
import type { DocumentType } from '@/lib/document-types'

export interface CreateDocumentPayloadV1 {
  ref?: string
  title?: string
  issue_date?: string
  category_ids?: string[]
  footer?: string
  header?: string
  source?: string[]
  status?: string
  document_type_id?: string
  language?: string
  owners_notes?: string[]
  raw_text?: string
  json_header?: string
  json_footer?: string
}

export async function createDocumentV1(
  payload: CreateDocumentPayloadV1
): Promise<DocumentType> {
  const { data } = await axiosInstance.post<DocumentType>('/documents', payload)
  return data
}

export type UpdateDocumentPayloadV1 = CreateDocumentPayloadV1

export async function updateDocumentV1(
  id: string,
  payload: UpdateDocumentPayloadV1
): Promise<DocumentType> {
  const { data } = await axiosInstance.patch<DocumentType>(
    `/documents/${id}`,
    payload
  )
  return data
}
