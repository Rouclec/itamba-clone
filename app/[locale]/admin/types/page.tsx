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
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useListDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
  type DocumentTypeRecord,
} from '@/hooks/use-document-types'
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

export default function AdminTypesPage() {
  const { t } = useT('translation')
  const { userId, currentUser } = useAuth()
  const userIdParam = userId ?? currentUser?.userId ?? 'itamba_user'

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editType, setEditType] = useState<DocumentTypeRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentTypeRecord | null>(null)

  const { data, isLoading } = useListDocumentTypes(userIdParam, page, PAGE_SIZE)
  const createMutation = useCreateDocumentType()
  const updateMutation = useUpdateDocumentType()
  const deleteMutation = useDeleteDocumentType()

  const types = data?.document_types ?? []
  const totalItems = Number(data?.statistics?.total_items ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const isMobile = useIsMobile()

  const handleOpenCreate = () => {
    setEditType(null)
    setModalOpen(true)
  }
  const handleOpenEdit = (row: DocumentTypeRecord) => {
    setEditType(row)
    setModalOpen(true)
  }
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditType(null)
  }
  const handleDeleteClick = (row: DocumentTypeRecord) => setDeleteTarget(row)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { documentTypeId: deleteTarget.id, userId: userIdParam },
      {
        onSuccess: () => {
          toast.success(t('admin.types.deleteSuccess'))
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
              {t('admin.types.title')}
            </h1>
            <p className="text-body-text font-normal">
              {t('admin.types.subtitle')}
            </p>
          </div>
          <Button
            className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto w-full"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4" />
            {t('admin.types.newType')}
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-surface">
                <TableHead className="font-bold p-4 min-w-[180px]">
                  {t('admin.types.titleEn')}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[180px]">
                  {t('admin.types.titleFr')}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[100px] text-right">
                  {t('admin.types.actions')}
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
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center py-8">
                    {t('admin.types.noTypes')}
                  </TableCell>
                </TableRow>
              ) : (
                types.map((row, index) => (
                  <TableRow
                    key={row.id}
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
                                aria-label={t('admin.types.actionEdit')}
                                onClick={() => handleOpenEdit(row)}
                              >
                                <Pencil className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t('admin.types.actionEdit')}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-destructive"
                                aria-label={t('admin.types.actionDelete')}
                                onClick={() => handleDeleteClick(row)}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t('admin.types.actionDelete')}</TooltipContent>
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

      <TypeFormModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        editType={editType}
        userId={userIdParam}
        onCreateSuccess={() => {
          toast.success(t('admin.types.createSuccess'))
          handleCloseModal()
        }}
        onUpdateSuccess={() => {
          toast.success(t('admin.types.updateSuccess'))
          handleCloseModal()
        }}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.types.actionDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.types.deleteConfirm')}
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

function TypeFormModal({
  open,
  onOpenChange,
  editType,
  userId,
  onCreateSuccess,
  onUpdateSuccess,
  createMutation,
  updateMutation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editType: DocumentTypeRecord | null
  userId: string
  onCreateSuccess: () => void
  onUpdateSuccess: () => void
  createMutation: ReturnType<typeof useCreateDocumentType>
  updateMutation: ReturnType<typeof useUpdateDocumentType>
}) {
  const { t } = useT('translation')
  const [titleEn, setTitleEn] = useState('')
  const [titleFr, setTitleFr] = useState('')
  const [errors, setErrors] = useState<{ titleEn?: string; titleFr?: string }>({})

  const isEdit = !!editType
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isFormEmpty = !titleEn.trim() || !titleFr.trim()
  const isSubmitDisabled = isSubmitting || isFormEmpty

  useEffect(() => {
    if (open) {
      setTitleEn(editType?.titles?.en ?? '')
      setTitleFr(editType?.titles?.fr ?? '')
      setErrors({})
    }
  }, [open, editType])

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitleEn(editType?.titles?.en ?? '')
      setTitleFr(editType?.titles?.fr ?? '')
      setErrors({})
    } else {
      setTitleEn('')
      setTitleFr('')
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
    if (isEdit) {
      if (!editType?.id) return
      updateMutation.mutate(
        { id: editType.id, user_id: userId, en: titleEn, fr: titleFr },
        { onSuccess: onUpdateSuccess, onError: () => toast.error(t('auth.errorOccurred')) }
      )
    } else {
      createMutation.mutate(
        { user_id: userId, titles: { en: titleEn, fr: titleFr } },
        { onSuccess: onCreateSuccess, onError: () => toast.error(t('auth.errorOccurred')) }
      )
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('admin.newDocument.editTitle') : t('admin.types.newType')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type-title-en">{t('admin.types.titleEn')}</Label>
            <Input
              id="type-title-en"
              value={titleEn}
              onChange={(e) => {
                setTitleEn(e.target.value)
                if (errors.titleEn) setErrors((prev) => ({ ...prev, titleEn: undefined }))
              }}
              placeholder={t('admin.types.titleEn')}
              className={errors.titleEn ? 'border-destructive' : ''}
            />
            {errors.titleEn && (
              <p className="text-destructive text-xs">{errors.titleEn}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-title-fr">{t('admin.types.titleFr')}</Label>
            <Input
              id="type-title-fr"
              value={titleFr}
              onChange={(e) => {
                setTitleFr(e.target.value)
                if (errors.titleFr) setErrors((prev) => ({ ...prev, titleFr: undefined }))
              }}
              placeholder={t('admin.types.titleFr')}
              className={errors.titleFr ? 'border-destructive' : ''}
            />
            {errors.titleFr && (
              <p className="text-destructive text-xs">{errors.titleFr}</p>
            )}
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
