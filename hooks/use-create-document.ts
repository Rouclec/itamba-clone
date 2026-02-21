import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDocumentV1,
  updateDocumentV1,
  type CreateDocumentPayloadV1,
} from '@/lib/create-document-api'

export interface CreateDocumentInput {
  ref: string
  title: string
  issueDate: string
  categoryIds: string[]
  documentTypeId: string
  documentTypeName: string
  language: string
  jsonHeader: string
  jsonFooter: string
  rawText: string
  source: string[]
  ownersNotes?: string[]
  status?: string
}

export function buildDocumentBody(input: CreateDocumentInput): CreateDocumentPayloadV1 {
  return {
    ref: input.ref || undefined,
    title: input.title || undefined,
    issue_date: input.issueDate || undefined,
    category_ids:
      input.categoryIds?.length ? input.categoryIds : undefined,
    document_type_id: input.documentTypeId || undefined,
    language: input.language || undefined,
    json_header: input.jsonHeader?.trim() || undefined,
    json_footer: input.jsonFooter?.trim() || undefined,
    raw_text: input.rawText?.trim() || undefined,
    source: input.source?.length ? input.source : undefined,
    owners_notes: input.ownersNotes?.length ? input.ownersNotes : undefined,
    status: input.status,
  }
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDocumentPayloadV1) => createDocumentV1(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: CreateDocumentPayloadV1
    }) => updateDocumentV1(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents-statistics'] })
      queryClient.invalidateQueries({
        queryKey: ['document-details', variables.id],
      })
    },
  })
}
