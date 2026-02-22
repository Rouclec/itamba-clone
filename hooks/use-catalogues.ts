import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCatalogues,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
  type CatalogueRecord,
} from '@/lib/catalogues-api'

const CATALOGUES_QUERY_KEY = 'catalogues'

export function useListCatalogues(userId: string | null, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [CATALOGUES_QUERY_KEY, userId, page, pageSize],
    queryFn: () =>
      listCatalogues({
        userId: userId!,
        page,
        pageSize,
      }),
    enabled: !!userId,
  })
}

export function useCreateCatalogue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCatalogue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOGUES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateCatalogue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCatalogue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOGUES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteCatalogue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCatalogue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOGUES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export type { CatalogueRecord }
