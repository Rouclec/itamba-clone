/**
 * Document status values for admin document management.
 * Order: inProgress → validated → reviewed → archived → published.
 */
export const DOCUMENT_STATUSES = [
  'inProgress',
  'validated',
  'reviewed',
  'archived',
  'published',
] as const

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

/** Map our status key to API value (e.g. inProgress → inProgress). */
export function documentStatusToApi(status: string): string {
  const s = status.trim().toLowerCase()
  if (s === 'inprogress') return 'inProgress'
  if (s === 'validated') return 'validated'
  if (s === 'reviewed') return 'reviewed'
  if (s === 'archived') return 'archived'
  if (s === 'published') return 'published'
  return status
}

/** Map API status string to our status key. */
export function apiStatusToDocumentStatus(apiStatus: string | undefined): DocumentStatus | '' {
  if (!apiStatus?.trim()) return ''
  const s = apiStatus.trim().toLowerCase().replace(/\s+/g, '')
  if (s === 'inprogress' || s === 'in_progress') return 'inProgress'
  if (s === 'validated') return 'validated'
  if (s === 'reviewed') return 'reviewed'
  if (s === 'archived') return 'archived'
  if (s === 'published') return 'published'
  return ''
}
