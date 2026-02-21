/**
 * Document types for admin documents API.
 * Aligns with backend response shapes (Documents, DocumentType, Statistics).
 */

export interface Titles {
  en: string
  fr: string
}

export interface DocumentsType {
  id: string
  titles: Titles
  image_url: string
  years?: { year: number; document_count: number }[]
  caption?: string
  user_id: string
  created_at: Date | string
  updated_at: Date | string
}

export interface DocumentCreatorInfo {
  user_name: string
  email: string
}

export interface OwnersNote {
  msg: string
  name: string
}

export interface DocumentType {
  document_creator_info?: DocumentCreatorInfo
  id?: string
  document_number?: string
  ref: string
  user_id?: string
  title: string
  header?: string
  revision_id?: number
  footer?: string
  document_type: DocumentsType
  sub_category?: string
  material_count?: number
  language: string
  categories?: { category_id?: string; titles: Titles; [key: string]: unknown }[]
  category_ids?: string[]
  root_material_id?: string
  status?: string
  version?: string
  owners_notes?: OwnersNote[]
  issue_date?: string
  document_type_id?: string
  json_header?: string
  json_footer?: string
  source?: string[]
  raw_text?: string
  created_at?: string
  updated_at?: string
  DeletedAt?: null
  document_id?: string
  [key: string]: unknown
}

export interface Statistics {
  current_page: number
  page_count: number
  total_items: number
}

export interface DocumentsResponse {
  statistics: Statistics
  documents: DocumentType[]
}
