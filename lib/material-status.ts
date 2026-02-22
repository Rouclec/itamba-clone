/**
 * Material status for admin materials table (subset of document statuses).
 */
export const MATERIAL_STATUSES = ['inProgress', 'validated'] as const
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number]

export function materialStatusToApi(status: string): string {
  const s = status.trim().toLowerCase()
  if (s === 'inprogress') return 'inProgress'
  if (s === 'validated') return 'validated'
  return status
}
