/**
 * Document types API (v1): list, create, update, delete.
 */

import axiosInstance from '@/utils/inteceptor'

export interface DocumentTypeRecord {
  id: string
  user_id: string
  titles: { en: string; fr: string }
  created_at?: string
  updated_at?: string
}

export interface ListDocumentTypesResponse {
  document_types?: DocumentTypeRecord[]
  statistics?: { current_page?: number; page_count?: number; total_items?: number }
}

export async function listDocumentTypes(params: {
  user_id: string
  page?: number
  page_size?: number
}): Promise<ListDocumentTypesResponse> {
  try {
    const { data } = await axiosInstance.get<ListDocumentTypesResponse | DocumentTypeRecord[]>(
      '/documents/document_types',
      { params: { user_id: params.user_id, page: params.page, page_size: params.page_size } }
    )
    if (Array.isArray(data)) return { document_types: data }
    return data ?? { document_types: [] }
  } catch {
    return { document_types: [] }
  }
}

export async function createDocumentType(payload: {
  user_id: string
  titles: { en: string; fr: string }
}): Promise<DocumentTypeRecord> {
  const { data } = await axiosInstance.post<DocumentTypeRecord>(
    '/documents/document_types',
    payload
  )
  return data!
}

export async function updateDocumentType(payload: {
  id: string
  user_id: string
  en: string
  fr: string
}): Promise<DocumentTypeRecord> {
  const { data } = await axiosInstance.patch<DocumentTypeRecord>(
    `/documents/document_types/${payload.id}`,
    { user_id: payload.user_id, titles: { en: payload.en, fr: payload.fr } }
  )
  return data!
}

export async function deleteDocumentType(params: {
  documentTypeId: string
  userId: string
}): Promise<void> {
  await axiosInstance.delete('/documents/document_type', {
    params: { document_type_id: params.documentTypeId, user_id: params.userId },
  })
}
