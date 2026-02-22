/**
 * Minimal types for document details (v1 GET /document/materials).
 * Extended as needed for the details screen.
 * API may return snake_case or camelCase; we support both.
 */

export interface DocumentDetailsMaterial {
  /** Material id; used to match bookmarks (bookmark.materialId). */
  id?: string;
  ref: string;
  position?: number;
  /** ProseMirror/TipTap JSON (stringified). Preferred over body when present. */
  json_body?: string;
  body?: string;
  raw_text?: string;
  children?: DocumentDetailsMaterial[];
}

export interface DocumentDetailsDocumentType {
  id?: string;
  titles?: { en?: string; fr?: string };
  caption?: string;
}

export interface DocumentDetailsCategory {
  categoryId?: string;
  category_id?: string;
  titles?: { en?: string; fr?: string };
}

export interface DocumentDetailsOwnerNote {
  msg?: string;
  name?: string;
  timestamp?: string;
}

export interface DocumentDetails {
  id?: string;
  document_number?: string;
  documentNumber?: string;
  ref: string;
  /** ID of the root material for this document (API: root_material_id / rootMaterialId). Used as parent_id when reordering top-level materials. */
  root_material_id?: string;
  rootMaterialId?: string;
  title: string;
  /** ProseMirror/TipTap JSON (stringified). Preferred over header when present. */
  json_header?: string;
  jsonHeader?: string;
  header?: string;
  /** ProseMirror/TipTap JSON (stringified). Preferred over footer when present. */
  json_footer?: string;
  jsonFooter?: string;
  footer?: string;
  document_type?: DocumentDetailsDocumentType;
  documentType?: DocumentDetailsDocumentType;
  documentTypeId?: string;
  language?: string;
  issue_date?: string;
  issueDate?: string;
  raw_text?: string;
  rawText?: string;
  /** Category IDs (snake_case API). */
  category_ids?: string[];
  /** Category IDs (camelCase API). */
  categoryIds?: string[];
  /** Category objects (camelCase API). */
  categories?: DocumentDetailsCategory[];
  /** Source URL(s). API may return single string or array. */
  source?: string[] | string;
  /** Owner notes (snake_case API). */
  owners_notes?: DocumentDetailsOwnerNote[];
  /** Owner notes (camelCase API). */
  ownersNotes?: DocumentDetailsOwnerNote[];
  children?: DocumentDetailsMaterial[];
}
