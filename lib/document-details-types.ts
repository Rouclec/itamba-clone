/**
 * Minimal types for document details (v1 GET /document/materials).
 * Extended as needed for the details screen.
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

export interface DocumentDetails {
  id?: string;
  document_number?: string;
  ref: string;
  title: string;
  /** ProseMirror/TipTap JSON (stringified). Preferred over header when present. */
  json_header?: string;
  header?: string;
  /** ProseMirror/TipTap JSON (stringified). Preferred over footer when present. */
  json_footer?: string;
  footer?: string;
  document_type?: DocumentDetailsDocumentType;
  language?: string;
  issue_date?: string;
  raw_text?: string;
  children?: DocumentDetailsMaterial[];
}
