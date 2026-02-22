'use client'

import { useState, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useT } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditorBlock } from '@/components/client-library/note-editor'
import { useCreateMaterial, useUpdateMaterial, useGetMaterial } from '@/hooks/use-materials'
import type {
  MaterialPayload,
  MaterialTypeKind,
} from '@/types/material/type.material'
import { getAxiosErrorMessage } from '@/utils/axios-error'

export interface NewMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Document this material belongs to. */
  documentId?: string | null
  /** Parent material or document id (required for create: root = document id, or another material's id). */
  parentId?: string | null
  /** Label for the parent field (e.g. document ref or division ref). */
  parentRef?: string
  /** Edit mode: pre-fill and PATCH on submit */
  editMaterialId?: string | null
  onSubmit?: () => void
}

export function NewMaterialModal({
  open,
  onOpenChange,
  documentId = null,
  parentId = null,
  parentRef = '',
  editMaterialId = null,
  onSubmit,
}: NewMaterialModalProps) {
  const isEditMode = !!editMaterialId
  const { t } = useT('translation')

  const [materialType, setMaterialType] = useState<MaterialTypeKind>('article')
  const [title, setTitle] = useState('')
  const [reference, setReference] = useState('')
  const [bodyJson, setBodyJson] = useState('')
  const [label, setLabel] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: editMaterial, isLoading: editMaterialLoading } = useGetMaterial(
    isEditMode ? editMaterialId : null
  )

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()

  useEffect(() => {
    if (!open) return
    if (!isEditMode) {
      setMaterialType('article')
      setTitle('')
      setReference('')
      setBodyJson('')
      setLabel('')
      setErrors({})
      return
    }
    if (!editMaterial) return
    const raw = editMaterial as Record<string, unknown>
    const typeVal = (raw.material_type ?? raw.materialType) as string | undefined
    const kind =
      typeVal === 'division' || typeVal === 'article' ? typeVal : 'article'
    setMaterialType(kind as MaterialTypeKind)
    setTitle((raw.title as string) ?? '')
    setReference((raw.ref as string) ?? '')
    const bodyRaw = (raw.json_body ?? raw.jsonBody) as string | undefined
    setBodyJson(
      bodyRaw?.trim() && bodyRaw !== '{}' ? bodyRaw : ''
    )
    const labelsArr = raw.labels as string[] | undefined
    setLabel(
      Array.isArray(labelsArr) && labelsArr.length > 0 ? labelsArr[0] : ''
    )
    setErrors({})
  }, [open, isEditMode, editMaterial])

  const validate = useCallback((): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!reference.trim()) next.reference = t('admin.newMaterial.validationRequired')
    if (materialType === 'division' && !title.trim())
      next.title = t('admin.newMaterial.validationRequired')
    if (materialType === 'article') {
      if (!bodyJson?.trim() || bodyJson.trim() === '{}')
        next.body = t('admin.newMaterial.validationRequired')
    }
    return next
  }, [reference, materialType, title, bodyJson, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})

    const payload: MaterialPayload = {
      ref: reference.trim(),
      material_type: materialType,
      json_body:
        materialType === 'article' && bodyJson?.trim() && bodyJson !== '{}'
          ? bodyJson
          : '{}',
      status: 'inProgress',
      labels: materialType === 'article' && label.trim() ? [label.trim()] : [],
    }
    if (documentId) payload.document_id = documentId
    if (parentId) payload.parent_id = parentId
    if (materialType === 'division') payload.title = title.trim()

    const onSuccess = () => {
      onOpenChange(false)
      setReference('')
      setTitle('')
      setBodyJson('')
      setLabel('')
      onSubmit?.()
    }

    if (isEditMode && editMaterialId) {
      updateMaterial.mutate(
        { id: editMaterialId, payload },
        {
          onSuccess,
          onError: (err) => {
            const msg = getAxiosErrorMessage(err)
            setErrors({
              form: msg?.trim() ? msg : t('admin.newMaterial.updateError'),
            })
          },
        }
      )
    } else {
      createMaterial.mutate(payload, {
        onSuccess,
        onError: (err) => {
          const msg = getAxiosErrorMessage(err)
          setErrors({
            form: msg?.trim() ? msg : t('admin.newMaterial.createError'),
          })
        },
      })
    }
  }

  const displayParentRef = parentRef

  const isPending = createMaterial.isPending || updateMaterial.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-[90vw] w-full flex-col gap-4 overflow-hidden sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditMode ? t('admin.newMaterial.editTitle') : t('admin.newMaterial.title')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
        >
          {editMaterialLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {t('admin.newMaterial.loading')}
            </div>
          )}

          {!editMaterialLoading && (
            <>
              {errors.form && (
                <p className="text-destructive text-sm px-1" role="alert">
                  {errors.form}
                </p>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-1 py-1">
                <div className="space-y-2">
                  <Label>{t('admin.newMaterial.materialTypeLabel')}</Label>
                  <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                    <button
                      type="button"
                      onClick={() => setMaterialType('article')}
                      className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition ${
                        materialType === 'article'
                          ? 'bg-white text-primary shadow-sm'
                          : 'bg-transparent text-primary'
                      }`}
                      aria-pressed={materialType === 'article'}
                      aria-label={t('admin.newMaterial.article')}
                    >
                      {t('admin.newMaterial.article')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialType('division')}
                      className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition ${
                        materialType === 'division'
                          ? 'bg-white text-primary shadow-sm'
                          : 'bg-transparent text-primary'
                      }`}
                      aria-pressed={materialType === 'division'}
                      aria-label={t('admin.newMaterial.division')}
                    >
                      {t('admin.newMaterial.division')}
                    </button>
                  </div>
                </div>

                {materialType === 'division' && (
                  <div className="space-y-2">
                    <Label htmlFor="material-title">
                      {t('admin.newMaterial.titleLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                      id="material-title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value)
                        if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
                      }}
                      placeholder={t('admin.newMaterial.titlePlaceholder')}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-destructive text-xs">{errors.title}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="material-ref">
                    {t('admin.newMaterial.referenceLabel')}
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="material-ref"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value)
                      if (errors.reference) setErrors((prev) => ({ ...prev, reference: '' }))
                    }}
                    placeholder={t('admin.newMaterial.referencePlaceholder')}
                    className={errors.reference ? 'border-destructive' : ''}
                    required
                  />
                  {errors.reference && (
                    <p className="text-destructive text-xs">{errors.reference}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material-parent">{t('admin.newMaterial.parentLabel')}</Label>
                  <Input
                    id="material-parent"
                    value={displayParentRef}
                    readOnly
                    disabled
                    className="cursor-not-allowed opacity-70"
                    placeholder={t('admin.newMaterial.parentPlaceholder')}
                  />
                </div>

                {materialType === 'article' && (
                  <>
                    <div className="space-y-1">
                      <RichTextEditorBlock
                        key={
                          isEditMode && editMaterial
                            ? `body-${editMaterialId}-loaded`
                            : 'body-new'
                        }
                        label={t('admin.newMaterial.bodyLabel')}
                        value={bodyJson}
                        onChange={(v) => {
                          setBodyJson(v)
                          if (errors.body) setErrors((prev) => ({ ...prev, body: '' }))
                        }}
                        required
                      />
                      {errors.body && (
                        <p className="text-destructive text-xs">{errors.body}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-label">{t('admin.newMaterial.labelLabel')}</Label>
                      <Input
                        id="material-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={t('admin.newMaterial.labelPlaceholder')}
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="shrink-0 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('admin.newMaterial.cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : isEditMode ? (
                    t('admin.newMaterial.save')
                  ) : (
                    t('admin.newMaterial.create')
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
