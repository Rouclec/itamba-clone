/**
 * Materials API: create, update, delete, position, transition.
 */

import axiosInstance from '@/utils/inteceptor'
import type {
  MaterialType,
  MaterialPayload,
  MaterialBulkActionResponse,
} from '@/types/material/type.material'

export async function createMaterial(
  payload: MaterialPayload
): Promise<MaterialType> {
  const { data } = await axiosInstance.post<MaterialType>(
    '/documents/materials',
    payload
  )
  return data
}

export async function updateMaterial(
  id: string,
  payload: MaterialPayload
): Promise<MaterialType> {
  const { data } = await axiosInstance.patch<MaterialType>(
    `/documents/materials/${id}`,
    payload
  )
  return data
}

export async function deleteMaterial(id: string): Promise<void> {
  await axiosInstance.delete(`/documents/materials/${id}`)
}

export interface UpdateMaterialPositionPayload {
  parent_id: string
  changed_range: [number, number]
}

export async function updateMaterialPosition(
  payload: UpdateMaterialPositionPayload
): Promise<unknown> {
  const { data } = await axiosInstance.post(
    '/documents/materials/position',
    payload
  )
  return data
}

export interface TransitionMaterialsPayload {
  user_id: string
  state: 'validated' | 'inProgress'
  materials: string[]
}

export async function transitionMaterials(
  payload: TransitionMaterialsPayload
): Promise<MaterialBulkActionResponse> {
  const { data } = await axiosInstance.patch<MaterialBulkActionResponse>(
    '/transition/materials/bulk/actions',
    payload
  )
  return data
}
