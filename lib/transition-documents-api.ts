import axiosInstance from '@/utils/inteceptor'

export interface TransitionDocumentsPayload {
  user_id: string
  state: string
  documents: string[]
}

export interface TransitionFailedMaterial {
  status: number
  material_id: string
  material_reference?: string
  material_status?: string
  material_type?: string
  message: string
}

export interface TransitionFailedItem {
  status: number
  document_id: string
  document_reference?: string
  state?: string
  message: string
  materials?: TransitionFailedMaterial[]
}

export interface TransitionDocumentsResponse {
  message?: string
  success?: string[]
  failed?: TransitionFailedItem[]
}

/** Display message for one failed document: first material (reference + message) or generic. */
export function getFailedItemDisplayMessage(item: TransitionFailedItem): string {
  const first = item.materials?.[0]
  if (!first) return item.message
  const ref = first.material_reference?.trim()
  return ref ? `${ref}: ${first.message}` : first.message
}

export async function transitionMultipleDocuments(
  payload: TransitionDocumentsPayload
): Promise<TransitionDocumentsResponse> {
  const res = await axiosInstance.patch<TransitionDocumentsResponse>(
    '/transition/documents/bulk/actions',
    payload
  )
  return res.data
}
