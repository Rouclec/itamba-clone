import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/utils/inteceptor'
import { apiStatusToDocumentStatus } from '@/lib/document-status'

export interface DocumentStatistic {
  status: string
  count: number
}

/** Raw shape from API (PascalCase from backend). */
interface DocumentsCountResponseItem {
  Status?: string
  DocCount?: number
}

const DOCUMENTS_STATISTICS_STALE_TIME_MS = 1 * 60 * 1000 // 1 minute

/** Map API status string to our tab status key (inProgress, validated, etc.). */
function normalizeStatus(apiStatus: string | undefined): string {
  if (!apiStatus) return ''
  const s = apiStatus.trim().toLowerCase().replace(/\s+/g, '')
  if (s === 'inprogress' || s === 'in_progress') return 'inProgress'
  if (s === 'validated') return 'validated'
  if (s === 'reviewed') return 'reviewed'
  if (s === 'archived') return 'archived'
  if (s === 'published') return 'published'
  return apiStatus
}

export async function fetchDocumentsStatistics(): Promise<DocumentStatistic[]> {
  const response = await axiosInstance.get<{ data?: DocumentsCountResponseItem[] }>(
    '/documents/count'
  )
  const raw = response.data?.data ?? response.data
  const items = Array.isArray(raw) ? raw : []
  return items.map((item: DocumentsCountResponseItem) => ({
    status: (apiStatusToDocumentStatus(item.Status) ?? item.Status) ?? '',
    count: typeof item.DocCount === 'number' ? item.DocCount : Number(item.DocCount) || 0,
  }))
}

export function useGetDocumentsStatistics() {
  return useQuery({
    queryKey: ['documents-statistics'],
    queryFn: fetchDocumentsStatistics,
    staleTime: DOCUMENTS_STATISTICS_STALE_TIME_MS,
  })
}

/** Get count for a given status (use our tab key: inProgress, validated, etc.). */
export function getCountByStatus(
  data: DocumentStatistic[] | undefined,
  status: string
): number {
  return data?.find((stat) => stat.status === status)?.count ?? 0
}
