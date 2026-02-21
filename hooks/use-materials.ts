import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMaterial, updateMaterial } from '@/lib/materials-api'
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
      if (variables.documentId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', variables.documentId],
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
      if (data?.documentId) {
        queryClient.invalidateQueries({
          queryKey: ['document-details', data.documentId],
        })
      }
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['material', data.id] })
      }
    },
  })
}
