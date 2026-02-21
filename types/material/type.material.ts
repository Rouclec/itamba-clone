/**
 * Material type for create/update API.
 * Aligns with v2Material from documents/materials API.
 */

export type MaterialTypeKind = 'article' | 'division'

export interface MaterialType {
  id?: string
  title?: string
  ref?: string
  materialType?: MaterialTypeKind | string
  status?: string
  position?: string
  labels?: string[]
  documentId?: string
  parentId?: string
  body?: string
  jsonBody?: string
  children?: MaterialType[]
  createdAt?: string
  updatedAt?: string
}

/** Payload for POST /documents/materials (create) and PATCH /documents/materials/:id (update). */
export type MaterialPayload = Partial<MaterialType>
