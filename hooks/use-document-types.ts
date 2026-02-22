import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  type DocumentTypeRecord,
} from '@/lib/document-types-api'

const DOCUMENT_TYPES_QUERY_KEY = 'document-types'

export function useListDocumentTypes(userId: string | null, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [DOCUMENT_TYPES_QUERY_KEY, userId, page, pageSize],
    queryFn: () =>
      listDocumentTypes({
        user_id: userId!,
        page,
        page_size: pageSize,
      }),
    enabled: !!userId,
  })
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_TYPES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_TYPES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_TYPES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export type { DocumentTypeRecord }
