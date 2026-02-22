/**
 * Builds a tree of materials for the admin materials table from document details.
 * Document details children may not have status/dates; we use defaults for UI.
 */

import type { DocumentDetails, DocumentDetailsMaterial } from '@/lib/document-details-types'
import type { MaterialStatus } from '@/lib/material-status'

export interface AdminMaterialRow {
  id: string
  ref: string
  material_number: string
  title?: string
  status: MaterialStatus
  parentId: string
  material_type: 'article' | 'division'
  childrenCount: number
  createdAt: Date
  updatedAt: Date
  children: AdminMaterialRow[]
  /** Depth in tree (0 = root level under document). */
  depth: number
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date(0)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date(0) : d
}

function mapMaterial(
  m: DocumentDetailsMaterial,
  parentId: string,
  depth: number,
  index: number
): AdminMaterialRow {
  const id = (m as { id?: string }).id ?? `material-${parentId}-${index}`
  const raw = m as Record<string, unknown>
  const status = (raw.status === 'validated' ? 'validated' : 'inProgress') as MaterialStatus
  const materialType =
    (raw.material_type ?? raw.materialType ?? (m.children?.length ? 'division' : 'article')) as
      | 'article'
      | 'division'
  const children = (m.children ?? []).map((child, i) =>
    mapMaterial(child, id, depth + 1, i)
  )
  return {
    id,
    ref: m.ref ?? '',
    material_number: (raw.material_number ?? raw.materialNumber ?? String(index + 1)) as string,
    title: (raw.title as string) ?? undefined,
    status: status === 'validated' ? 'validated' : 'inProgress',
    parentId,
    material_type: materialType === 'division' ? 'division' : 'article',
    childrenCount: children.length,
    createdAt: parseDate((raw.created_at ?? raw.createdAt) as string | undefined),
    updatedAt: parseDate((raw.updated_at ?? raw.updatedAt) as string | undefined),
    children,
    depth,
  }
}

/**
 * Build admin material rows from document details. Root children become top-level rows.
 * documentId is used as parentId for the first level.
 */
export function buildMaterialTreeFromDocument(
  doc: DocumentDetails | null,
  documentId: string
): AdminMaterialRow[] {
  if (!doc?.children?.length) return []
  const parentId = (doc as { id?: string }).id ?? documentId
  return doc.children.map((child, index) =>
    mapMaterial(child, parentId, 0, index)
  )
}

/**
 * Flatten tree for filtering by status (keeps depth for indentation).
 */
export function flattenMaterialRows(rows: AdminMaterialRow[]): AdminMaterialRow[] {
  const out: AdminMaterialRow[] = []
  function walk(list: AdminMaterialRow[]) {
    for (const row of list) {
      out.push(row)
      if (row.children.length) walk(row.children)
    }
  }
  walk(rows)
  return out
}

/** Collect all descendant ids of a row (recursive). */
export function getDescendantIds(row: AdminMaterialRow): string[] {
  const ids: string[] = []
  function walk(r: AdminMaterialRow) {
    for (const c of r.children) {
      ids.push(c.id)
      walk(c)
    }
  }
  walk(row)
  return ids
}

/** Get ordered sibling ids (direct children of parentId). Root level: rows are the top-level list and parentId is the document id. */
export function getOrderedSiblingIds(
  rows: AdminMaterialRow[],
  parentId: string,
  documentId: string
): string[] {
  if (parentId === documentId) return rows.map((r) => r.id)
  function findChildren(list: AdminMaterialRow[], targetParentId: string): string[] | null {
    for (const row of list) {
      if (row.id === targetParentId) return row.children.map((c) => c.id)
      const found = findChildren(row.children, targetParentId)
      if (found) return found
    }
    return null
  }
  return findChildren(rows, parentId) ?? []
}

/** Find a row by id in the tree. */
export function getRowById(
  rows: AdminMaterialRow[],
  id: string
): AdminMaterialRow | null {
  for (const row of rows) {
    if (row.id === id) return row
    const found = getRowById(row.children, id)
    if (found) return found
  }
  return null
}
