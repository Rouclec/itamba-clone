import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  transitionMultipleDocuments,
  type TransitionDocumentsResponse,
} from '@/lib/transition-documents-api'

export type TransitionSuccessCallback = (data: TransitionDocumentsResponse) => void
export type TransitionErrorCallback = (error: unknown) => void

export function useTransitionMultipleDocuments(
  onSuccess?: TransitionSuccessCallback,
  onError?: TransitionErrorCallback
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transitionMultipleDocuments,
    onSuccess,
    onError,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
    },
  })
}
