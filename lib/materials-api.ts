/**
 * Materials API: POST /documents/materials (create), PATCH /documents/materials/:id (update)
 */

import axiosInstance from '@/utils/inteceptor'
import type { MaterialType, MaterialPayload } from '@/types/material/type.material'

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
