/**
 * Material types for create/update API and UI.
 * Create/update use Partial<MaterialType>.
 */

/** Minimal shape for user notes on materials (extend from user types if needed). */
export interface UserNoteType {
  id?: string
  [key: string]: unknown
}

export interface Breadcrumb {
  parent_id: string
  ref: string
}

export interface Review {
  id?: string
  name: string
  comment: string
  timestamp?: Date
}

export interface OwnerNote {
  name: string
  msg: string
}

export type MaterialTypeKind = 'article' | 'division'

export interface MaterialType {
  id: string
  ref: string
  title?: string
  material_type: MaterialTypeKind
  material_number: string
  position: number
  parent_id: string
  breadcrumbs: Breadcrumb[]
  breadcrumb_ref: string[]
  status: string
  revision_id: number | string
  children?: MaterialType[]
  labels?: string[]
  reviews?: Review[]
  ownerNotes?: OwnerNote[]
  links?: string[]
  document_id: string
  document_title?: string
  body?: string
  json_body?: string
  user_id: string
  created_at: string
  info: string
  updated_at: string
  notes: UserNoteType[]
}

export type ArticleType = MaterialType & {
  title: string
  body: string
  material_type: 'article'
  children?: []
}

export type DivisionType = MaterialType & {
  title: string
  material_type: 'division'
}

export interface MaterialBulkActionResponse {
  message: string
  success: MaterialBulkAction[]
  failed: MaterialBulkAction[]
}

export interface MaterialBulkAction {
  status: number
  material_id: string
  material_reference: string
  material_status: string
  material_type: string
  message: string
}

export interface MaterialParentDropdownType {
  id: string
  type: string
  name: string
  ref: string
}

export interface SelectMaterialType {
  material_id: string
  parent_material_id: string
  material_type: string
}

/** Payload for POST /documents/materials (create) and PATCH /documents/materials/:id (update). */
export type MaterialPayload = Partial<MaterialType>
