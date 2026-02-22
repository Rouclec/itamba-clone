'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useListCatalogues,
  useCreateCatalogue,
  useUpdateCatalogue,
  useDeleteCatalogue,
  type CatalogueRecord,
} from '@/hooks/use-catalogues'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

function getPaginationSlots(
  page: number,
  totalPages: number,
  maxVisible?: number,
): (number | 'ellipsis')[] {
  const limit = maxVisible ?? 7
  if (totalPages <= limit) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (limit <= 4) {
    if (page <= 2) return [1, 2, 'ellipsis', totalPages]
    if (page >= totalPages - 1) return [1, 'ellipsis', totalPages - 1, totalPages]
    return [1, 'ellipsis', page, 'ellipsis', totalPages]
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }
  if (page >= totalPages - 2) {
    return [1, 2, 3, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

function parseLabels(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
function formatLabels(labels: string[] | undefined): string {
  return (labels ?? []).join(', ')
}

export default function AdminCataloguesPage() {
  const { t } = useT('translation')
  const { userId, currentUser } = useAuth()
  const userIdParam = userId ?? currentUser?.userId ?? 'itamba_user'

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCatalogue, setEditCatalogue] = useState<CatalogueRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatalogueRecord | null>(null)

  const { data, isLoading } = useListCatalogues(userIdParam, page, PAGE_SIZE)
  const createMutation = useCreateCatalogue()
  const updateMutation = useUpdateCatalogue()
  const deleteMutation = useDeleteCatalogue()

  const catalogues = data?.categories ?? []
  const totalItems = Number(data?.statistics?.totalItems ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const isMobile = useIsMobile()

  const handleOpenCreate = () => {
    setEditCatalogue(null)
    setModalOpen(true)
  }
  const handleOpenEdit = (row: CatalogueRecord) => {
    setEditCatalogue(row)
    setModalOpen(true)
  }
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditCatalogue(null)
  }
  const handleDeleteClick = (row: CatalogueRecord) => setDeleteTarget(row)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.categoryId ?? deleteTarget.category_id
    if (!id) return
    deleteMutation.mutate(
      { categoryId: id, userId: userIdParam },
      {
        onSuccess: () => {
          toast.success(t('admin.catalogues.deleteSuccess'))
          setDeleteTarget(null)
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          toast.error(msg ?? t('auth.errorOccurred'))
        },
      }
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto">
      <div className="min-h-0 min-w-0 flex-1 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {t('admin.catalogues.title')}
            </h1>
            <p className="text-body-text font-normal">
              {t('admin.catalogues.subtitle')}
            </p>
          </div>
          <Button
            className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto w-full"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4" />
            {t('admin.catalogues.newCatalogue')}
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-surface">
                <TableHead className="font-bold p-4 min-w-[180px]">
                  {t('admin.catalogues.titleEn')}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[180px]">
                  {t('admin.catalogues.titleFr')}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[100px] text-right">
                  {t('admin.catalogues.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center py-8">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : catalogues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center py-8">
                    {t('admin.catalogues.noCatalogues')}
                  </TableCell>
                </TableRow>
              ) : (
                catalogues.map((row, index) => (
                  <TableRow
                    key={row.categoryId ?? row.category_id ?? index}
                    className={index % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}
                  >
                    <TableCell className="px-4 py-4">
                      {row.titles?.en ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {row.titles?.fr ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                                aria-label={t('admin.catalogues.actionEdit')}
                                onClick={() => handleOpenEdit(row)}
                              >
                                <Pencil className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t('admin.catalogues.actionEdit')}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-destructive"
                                aria-label={t('admin.catalogues.actionDelete')}
                                onClick={() => handleDeleteClick(row)}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t('admin.catalogues.actionDelete')}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end **:data-[slot=pagination-link]:font-normal">
          <Pagination className="w-full justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage((p) => p - 1)
                  }}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
              {getPaginationSlots(page, totalPages, isMobile ? 4 : 7).map(
                (slot, index) =>
                  slot === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <span className="px-2">…</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={slot}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(slot)
                        }}
                        isActive={page === slot}
                      >
                        {slot}
                      </PaginationLink>
                    </PaginationItem>
                  ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage((p) => p + 1)
                  }}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    page >= totalPages && 'pointer-events-none opacity-50',
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <CatalogueFormModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        editCatalogue={editCatalogue}
        userId={userIdParam}
        onCreateSuccess={() => {
          toast.success(t('admin.catalogues.createSuccess'))
          handleCloseModal()
        }}
        onUpdateSuccess={() => {
          toast.success(t('admin.catalogues.updateSuccess'))
          handleCloseModal()
        }}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.catalogues.actionDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.catalogues.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('admin.documents.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CatalogueFormModal({
  open,
  onOpenChange,
  editCatalogue,
  userId,
  onCreateSuccess,
  onUpdateSuccess,
  createMutation,
  updateMutation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editCatalogue: CatalogueRecord | null
  userId: string
  onCreateSuccess: () => void
  onUpdateSuccess: () => void
  createMutation: ReturnType<typeof useCreateCatalogue>
  updateMutation: ReturnType<typeof useUpdateCatalogue>
}) {
  const { t } = useT('translation')
  const [titleEn, setTitleEn] = useState('')
  const [titleFr, setTitleFr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descFr, setDescFr] = useState('')
  const [labelsStr, setLabelsStr] = useState('')
  const [errors, setErrors] = useState<{ titleEn?: string; titleFr?: string }>({})

  const isEdit = !!editCatalogue
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isFormEmpty = !titleEn.trim() || !titleFr.trim()
  const isSubmitDisabled = isSubmitting || isFormEmpty

  useEffect(() => {
    if (open) {
      setTitleEn(editCatalogue?.titles?.en ?? '')
      setTitleFr(editCatalogue?.titles?.fr ?? '')
      setDescEn(editCatalogue?.description?.en ?? '')
      setDescFr(editCatalogue?.description?.fr ?? '')
      setLabelsStr(formatLabels(editCatalogue?.labels))
      setErrors({})
    }
  }, [open, editCatalogue])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTitleEn('')
      setTitleFr('')
      setDescEn('')
      setDescFr('')
      setLabelsStr('')
      setErrors({})
    }
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { titleEn?: string; titleFr?: string } = {}
    if (!titleEn.trim()) nextErrors.titleEn = t('admin.newDocument.validationRequired')
    if (!titleFr.trim()) nextErrors.titleFr = t('admin.newDocument.validationRequired')
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    const labels = parseLabels(labelsStr)
    const description = { en: descEn, fr: descFr }
    if (isEdit) {
      const id = editCatalogue.categoryId ?? editCatalogue.category_id
      if (!id) return
      updateMutation.mutate(
        {
          category_id: id,
          user_id: userId,
          titles: { en: titleEn, fr: titleFr },
          description,
          labels,
        },
        { onSuccess: onUpdateSuccess, onError: () => toast.error(t('auth.errorOccurred')) }
      )
    } else {
      createMutation.mutate(
        {
          userId,
          titles: { en: titleEn, fr: titleFr },
          description,
          labels: labels.length ? labels : undefined,
        },
        { onSuccess: onCreateSuccess, onError: () => toast.error(t('auth.errorOccurred')) }
      )
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.newDocument.editTitle') : t('admin.catalogues.newCatalogue')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-title-en">{t('admin.catalogues.titleEn')}</Label>
            <Input
              id="cat-title-en"
              value={titleEn}
              onChange={(e) => {
                setTitleEn(e.target.value)
                if (errors.titleEn) setErrors((prev) => ({ ...prev, titleEn: undefined }))
              }}
              placeholder={t('admin.catalogues.titleEn')}
              className={errors.titleEn ? 'border-destructive' : ''}
            />
            {errors.titleEn && (
              <p className="text-destructive text-xs">{errors.titleEn}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-title-fr">{t('admin.catalogues.titleFr')}</Label>
            <Input
              id="cat-title-fr"
              value={titleFr}
              onChange={(e) => {
                setTitleFr(e.target.value)
                if (errors.titleFr) setErrors((prev) => ({ ...prev, titleFr: undefined }))
              }}
              placeholder={t('admin.catalogues.titleFr')}
              className={errors.titleFr ? 'border-destructive' : ''}
            />
            {errors.titleFr && (
              <p className="text-destructive text-xs">{errors.titleFr}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc-en">{t('admin.catalogues.descriptionEn')}</Label>
            <Textarea
              id="cat-desc-en"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder={t('admin.catalogues.descriptionEn')}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc-fr">{t('admin.catalogues.descriptionFr')}</Label>
            <Textarea
              id="cat-desc-fr"
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
              placeholder={t('admin.catalogues.descriptionFr')}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-labels">{t('admin.catalogues.labels')}</Label>
            <Input
              id="cat-labels"
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
              placeholder={t('admin.catalogues.labelsPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('admin.newDocument.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin shrink-0" />
                  {t('common.loading')}
                </>
              ) : isEdit ? (
                t('admin.newDocument.save')
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
