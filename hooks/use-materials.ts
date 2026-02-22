import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  updateMaterialPosition,
  transitionMaterials,
  type UpdateMaterialPositionPayload,
  type TransitionMaterialsPayload,
} from '@/lib/materials-api'
import type { MaterialPayload, MaterialType } from '@/types/material/type.material'
import axiosInstance from '@/utils/inteceptor'

export async function fetchMaterial(id: string): Promise<MaterialType | null> {
  const { data } = await axiosInstance.get<MaterialType>(
    `/documents/materials/${id}`
  )
  return data ?? null
}

export function useGetMaterial(id: string | null) {
  return useQuery({
    queryKey: ['material', id],
    queryFn: () => fetchMaterial(id!),
    enabled: !!id,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MaterialPayload) => createMaterial(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      const docId = variables.document_id ?? (variables as { documentId?: string }).documentId
      if (docId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', docId],
        })
      }
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MaterialPayload }) =>
      updateMaterial(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      const docId = data?.document_id ?? (data as { documentId?: string } | null)?.documentId
      if (docId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', docId],
        })
      }
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['material', data.id] })
      }
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      materialId,
    }: {
      materialId: string
      documentId?: string
    }) => deleteMaterial(materialId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      if (variables.documentId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', variables.documentId],
        })
      }
      queryClient.invalidateQueries({ queryKey: ['material', variables.materialId] })
    },
  })
}

export function useUpdateMaterialPosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      documentId: _docId,
      ...payload
    }: UpdateMaterialPositionPayload & { documentId?: string }) =>
      updateMaterialPosition(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      const documentId = variables.documentId ?? variables.parent_id
      queryClient.invalidateQueries({
        queryKey: ['document-details', documentId],
      })
    },
  })
}

export function useTransitionMaterials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TransitionMaterialsPayload & { documentId?: string }) => {
      const { documentId: _docId, ...apiPayload } = payload
      return transitionMaterials(apiPayload)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      if (variables.documentId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', variables.documentId],
        })
      }
    },
  })
}
