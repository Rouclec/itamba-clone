'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState, useCallback } from 'react'
import { Plus, Check, Minus, ChevronDown } from 'lucide-react'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LocaleLink } from '@/components/locale-link'
import { useGetDocumentDetails } from '@/hooks/use-documents'
import {
  buildMaterialTreeFromDocument,
  flattenMaterialRows,
  getDescendantIds,
  getOrderedSiblingIds,
  getRowById,
  type AdminMaterialRow,
} from '@/hooks/use-document-materials'
import {
  useDeleteMaterial,
  useUpdateMaterialPosition,
  useTransitionMaterials,
} from '@/hooks/use-materials'
import { useAuth } from '@/lib/auth-context'
import { MATERIAL_STATUSES, type MaterialStatus } from '@/lib/material-status'
import { DocumentMaterialsTable } from '@/components/admin/document-materials-table'
import { NewMaterialModal } from '@/components/admin/new-material-modal'
import { DocumentPreviewModal } from '@/components/admin/document-preview-modal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function DocumentMaterialsPage() {
  const params = useParams()
  const documentId = typeof params.documentId === 'string' ? params.documentId : ''
  const { t } = useT('translation')
  const { userId, currentUser } = useAuth()
  const userIdParam = userId ?? currentUser?.userId ?? 'itamba_user'

  const { data: doc, isLoading: docLoading } = useGetDocumentDetails(
    documentId || null
  )

  const deleteMaterialMutation = useDeleteMaterial()
  const updatePositionMutation = useUpdateMaterialPosition()
  const transitionMaterialsMutation = useTransitionMaterials()

  const materialTree = useMemo(
    () => buildMaterialTreeFromDocument(doc ?? null, documentId),
    [doc, documentId]
  )

  const [activeTab, setActiveTab] = useState<MaterialStatus>('inProgress')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [newMaterialOpen, setNewMaterialOpen] = useState(false)
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null)
  const [viewDocumentId, setViewDocumentId] = useState<string | null>(null)
  const [viewMaterialId, setViewMaterialId] = useState<string | null>(null)
  const [addChildParent, setAddChildParent] = useState<AdminMaterialRow | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<AdminMaterialRow | null>(null)
  const [targetStatus, setTargetStatus] = useState<MaterialStatus | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  /** Count only top-level materials (direct children of the document) per status. */
  const materialsByStatus = useMemo(() => {
    return {
      inProgress: materialTree.filter((r) => r.status === 'inProgress'),
      validated: materialTree.filter((r) => r.status === 'validated'),
    }
  }, [materialTree])

  /** Filter tree so only nodes matching activeTab status are included (recursive). */
  const filteredTree = useMemo(() => {
    function filterNodes(list: AdminMaterialRow[], status: MaterialStatus): AdminMaterialRow[] {
      return list
        .filter((r) => r.status === status)
        .map((r) => ({
          ...r,
          children: filterNodes(r.children, status),
        }))
    }
    return filterNodes(materialTree, activeTab)
  }, [materialTree, activeTab])

  const visibleMaterialIds = useMemo(
    () => flattenMaterialRows(filteredTree).map((r) => r.id),
    [filteredTree]
  )
  const allVisibleSelected =
    visibleMaterialIds.length > 0 &&
    visibleMaterialIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleMaterialIds.some((id) =>
    selectedIds.has(id)
  )
  const headerCheckedState: boolean | 'indeterminate' = allVisibleSelected
    ? true
    : someVisibleSelected
      ? 'indeterminate'
      : false

  const toggleSelectAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleMaterialIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const root of filteredTree) {
          next.add(root.id)
          getDescendantIds(root).forEach((id) => next.add(id))
        }
        return next
      })
    }
  }, [allVisibleSelected, visibleMaterialIds, filteredTree])

  const documentRef = doc?.ref ?? doc?.document_number ?? ''

  const toggleSelect = useCallback(
    (row: AdminMaterialRow) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(row.id)) {
          // Deselect: remove row + descendants; if child, remove parent + all siblings
          const toRemove = [row.id, ...getDescendantIds(row)]
          if (row.parentId !== documentId) {
            toRemove.push(
              row.parentId,
              ...getOrderedSiblingIds(filteredTree, row.parentId, documentId)
            )
          }
          toRemove.forEach((id) => next.delete(id))
        } else {
          // Select: root -> row + descendants; child -> parent + all siblings
          if (row.parentId === documentId) {
            next.add(row.id)
            getDescendantIds(row).forEach((id) => next.add(id))
          } else {
            next.add(row.parentId)
            getOrderedSiblingIds(filteredTree, row.parentId, documentId).forEach(
              (id) => next.add(id)
            )
          }
        }
        return next
      })
    },
    [documentId, filteredTree]
  )

  const handleView = useCallback((row: AdminMaterialRow) => {
    setViewDocumentId(documentId)
    setViewMaterialId(row.id)
  }, [documentId])

  const handleEdit = useCallback((row: AdminMaterialRow) => {
    setEditMaterialId(row.id)
  }, [])

  const handleDelete = useCallback((row: AdminMaterialRow) => {
    setDeleteTarget(row)
  }, [])

  const handleAddChild = useCallback((row: AdminMaterialRow) => {
    setAddChildParent(row)
  }, [])

  const handleReorder = useCallback(
    (fromId: string, toId: string, after: boolean) => {
      const fromRow = getRowById(filteredTree, fromId)
      if (!fromRow) return
      const parentId = fromRow.parentId
      const siblingIds = getOrderedSiblingIds(
        filteredTree,
        parentId,
        documentId
      )
      const oldPos = siblingIds.indexOf(fromId)
      if (oldPos === -1) return
      const withoutFrom = siblingIds.filter((id) => id !== fromId)
      const toIndex = withoutFrom.indexOf(toId)
      if (toIndex === -1) return
      const newPos = after ? toIndex + 1 : toIndex
      if (newPos === oldPos) return
      // API expects parent_id = root_material_id for top-level reorders when available, else the material's parent id. Use depth so we don't rely on parentId === documentId (doc.id may differ from route documentId).
      const rootMaterialId = doc?.root_material_id ?? doc?.rootMaterialId
      const apiParentId =
        fromRow.depth === 0 ? (rootMaterialId ?? parentId) : parentId
      // API uses 1-based positions: [oldPosition, newPosition]
      updatePositionMutation.mutate(
        {
          parent_id: apiParentId,
          changed_range: [oldPos + 1, newPos + 1],
          documentId,
        },
        {
          onError: (err: unknown) => {
            const message =
              (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ?? t('admin.materials.reorderFailed')
            toast.error(message)
          },
        }
      )
    },
    [doc, documentId, filteredTree, updatePositionMutation]
  )

  const inProgressCount = materialsByStatus.inProgress.length
  const validatedCount = materialsByStatus.validated.length

  if (!documentId) {
    return (
      <div className="px-6 py-8">
        <p className="text-destructive">Missing document ID.</p>
        <LocaleLink href="/admin" className="text-primary underline">
          Back to documents
        </LocaleLink>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto">
      <div className="min-h-0 min-w-0 flex-1 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <LocaleLink href="/admin">{t('admin.materials.breadcrumbDocuments')}</LocaleLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <LocaleLink href="/admin">{documentRef || documentId}</LocaleLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('admin.materials.breadcrumbMaterials')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-primary">
            {t('admin.materials.title')}
          </h1>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as MaterialStatus)}
          >
            <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-none border-b border-border bg-transparent p-0 sm:w-auto">
              <TabsTrigger
                value="inProgress"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t('admin.materials.inProgress')} ({docLoading ? '—' : inProgressCount})
              </TabsTrigger>
              <TabsTrigger
                value="validated"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t('admin.materials.validated')} ({docLoading ? '—' : validatedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto w-full"
            onClick={() => {
              setAddChildParent(null)
              setNewMaterialOpen(true)
            }}
          >
            <Plus className="size-4" />
            {t('admin.materials.newMaterial')}
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={
                  headerCheckedState === true
                    ? 'true'
                    : headerCheckedState === 'indeterminate'
                      ? 'mixed'
                      : 'false'
                }
                onClick={toggleSelectAllVisible}
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  headerCheckedState === true
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background'
                )}
              >
                {headerCheckedState === true ? (
                  <Check className="size-3.5" />
                ) : headerCheckedState === 'indeterminate' ? (
                  <Minus className="size-3.5" />
                ) : null}
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 shrink-0">
                    {t('admin.materials.moveTo')}
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {MATERIAL_STATUSES.filter((s) => s !== activeTab).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => {
                        setTargetStatus(status)
                        setConfirmOpen(true)
                      }}
                    >
                      {t(`admin.materials.${status}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {docLoading ? (
          <div className="rounded-lg border border-border bg-white px-4 py-12 text-center text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : (
          <DocumentMaterialsTable
            materials={filteredTree}
            fullTree={materialTree}
            documentId={documentId}
            documentRef={documentRef}
            activeTab={activeTab}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onReorder={handleReorder}
          />
        )}
      </div>

      {/* New material (top-level or as child) or Edit material */}
      <NewMaterialModal
        open={newMaterialOpen || !!addChildParent || !!editMaterialId}
        onOpenChange={(open) => {
          if (!open) {
            setNewMaterialOpen(false)
            setAddChildParent(null)
            setEditMaterialId(null)
          } else {
            setNewMaterialOpen(true)
          }
        }}
        documentId={documentId}
        parentId={addChildParent ? addChildParent.id : documentId}
        parentRef={addChildParent ? addChildParent.ref : documentRef}
        editMaterialId={editMaterialId}
        onSubmit={() => {
          setEditMaterialId(null)
          setNewMaterialOpen(false)
          setAddChildParent(null)
        }}
      />

      {/* View document modal */}
      <DocumentPreviewModal
        open={!!viewDocumentId}
        onOpenChange={(open) => {
          if (!open) {
            setViewDocumentId(null)
            setViewMaterialId(null)
          }
        }}
        document={doc ?? null}
        documentLoading={false}
        scrollToMaterialId={viewMaterialId}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.materials.actionDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                (deleteTarget.childrenCount > 0
                  ? t('admin.materials.deleteConfirmWithChildren', {
                      ref: deleteTarget.ref,
                      count: deleteTarget.childrenCount,
                    })
                  : t('admin.materials.deleteConfirm', { ref: deleteTarget.ref }))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('admin.documents.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return
                deleteMaterialMutation.mutate(
                  { materialId: deleteTarget.id, documentId },
                  {
                    onSettled: () => setDeleteTarget(null),
                  }
                )
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.materials.transitionConfirmHeading')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.materials.transitionConfirm', {
                count: selectedIds.size,
                status: targetStatus ? t(`admin.materials.${targetStatus}`) : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              {t('admin.documents.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!targetStatus) return
                transitionMaterialsMutation.mutate(
                  {
                    user_id: userIdParam,
                    state: targetStatus,
                    materials: Array.from(selectedIds),
                    documentId,
                  },
                  {
                    onSettled: () => {
                      setSelectedIds(new Set())
                      setConfirmOpen(false)
                      setTargetStatus(null)
                    },
                  }
                )
              }}
            >
              {t('admin.documents.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
