import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/utils/inteceptor'
import type { DocumentType, DocumentsResponse } from '@/lib/document-types'
import { documentStatusToApi } from '@/lib/document-status'

export interface GetAllDocumentsParams {
  page: number
  count: number
  userId: string
  documentStatus?: string
  documentType?: string
  isExtracted?: boolean
  searchKey?: string
  filterBy?: string
}

/** Table row shape used by the admin documents page. */
export interface AdminDocumentRow {
  id: string
  reference: string
  title: string
  type: string
  materialsCount: number
  createdBy: string | null
  ownerName: string | null
  updatedAt: Date
  language: 'EN' | 'FR'
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date(0)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date(0) : d
}

/** Map API DocumentType to admin table row. */
export function mapApiDocumentToRow(doc: DocumentType): AdminDocumentRow {
  const id = doc.id ?? doc.document_id ?? ''
  const reference = doc.ref ?? doc.document_number ?? ''
  const title = doc.title ?? ''
  const type =
    doc.document_type?.titles?.en ??
    doc.document_type?.titles?.fr ??
    ''
  const materialsCount = typeof doc.material_count === 'number' ? doc.material_count : Number(doc.material_count) || 0
  const createdBy = doc.user_id ?? null
  const ownerName = doc.document_creator_info?.user_name ?? null
  const updatedAt = parseDate(doc.updated_at)
  const lang = (doc.language ?? 'EN').toString().toUpperCase().slice(0, 2)
  const language = (lang === 'FR' ? 'FR' : 'EN') as 'EN' | 'FR'

  return {
    id,
    reference,
    title,
    type,
    materialsCount,
    createdBy,
    ownerName,
    updatedAt,
    language,
  }
}

export interface GetAllDocumentsResult {
  documents: AdminDocumentRow[]
  total: number
  pageCount: number
}

export async function getAllDocuments(
  queryParams: GetAllDocumentsParams
): Promise<GetAllDocumentsResult> {
  const params = new URLSearchParams()
  params.set('page', String(queryParams.page))
  params.set('page_size', String(queryParams.count))
  params.set('user_id', queryParams.userId)
  if (queryParams.documentStatus)
    params.set('status', documentStatusToApi(queryParams.documentStatus))
  if (queryParams.documentType) params.set('document_type_id', queryParams.documentType)
  if (queryParams.isExtracted !== undefined) params.set('is_extracted', String(queryParams.isExtracted))
  if (queryParams.searchKey) params.set('search_key', queryParams.searchKey)
  if (queryParams.filterBy) params.set('filter_by', queryParams.filterBy)

  const response = await axiosInstance.get<DocumentsResponse>(
    `/documents?${params.toString()}`
  )
  const body = response.data
  if (!body?.documents) {
    return { documents: [], total: 0, pageCount: 1 }
  }
  const total = body.statistics?.total_items ?? body.documents.length
  const pageCount =
    Math.max(1, Number(body.statistics?.page_count) || Math.ceil(total / queryParams.count) || 1)
  const documents = body.documents.map((item) => mapApiDocumentToRow(item))
  return { documents, total, pageCount }
}

/** Re-export for callers that already import from this hook. */
export { documentStatusToApi as docStatusToApi } from '@/lib/document-status'

const STALE_TIME_MS = 1 * 60 * 1000 // 1 minute

export function useGetAllDocuments(queryParams: GetAllDocumentsParams) {
  return useQuery({
    queryKey: ['documents', queryParams],
    queryFn: () => getAllDocuments(queryParams),
    staleTime: STALE_TIME_MS,
  })
}
