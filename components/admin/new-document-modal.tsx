'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useT } from '@/app/i18n/client'
import { DocumentPreviewModal } from '@/components/admin/document-preview-modal'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MultiSelect } from '@/components/ui/multi-select'
import { RichTextEditorBlock } from '@/components/client-library/note-editor'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useLocale } from '@/lib/use-locale'
import {
  documentsMaterialsServiceListCategoriesOptions,
  documentsMaterialsServiceListPublishedDocumentTypesOptions,
} from '@/@hey_api/documentsmaterials.swagger/@tanstack/react-query.gen'
import { useCreateDocument, useUpdateDocument, buildDocumentBody } from '@/hooks/use-create-document'
import type { DocumentDetails } from '@/lib/document-details-types'
import { getAxiosErrorMessage } from '@/utils/axios-error'

export interface NewDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: NewDocumentFormData) => void
  /** When set, modal is in edit mode: pre-fill from editDocument and PATCH on submit */
  editDocumentId?: string | null
  editDocument?: DocumentDetails | null
  editDocumentLoading?: boolean
}

export interface NewDocumentFormData {
  title: string
  type: string
  issuedDate: Date | undefined
  reference: string
  catalogues: string[]
  language: 'EN' | 'FR'
  headerJson: string
  footerJson: string
  rawText: string
  sourceLink: string
  ownerText: string
}

const SORT_BY_TITLE_EN = 'SORT_BY_TITLE_EN' as const
const SORT_BY_TITLE_FR = 'SORT_BY_TITLE_FR' as const

export function NewDocumentModal({
  open,
  onOpenChange,
  onSubmit,
  editDocumentId = null,
  editDocument = null,
  editDocumentLoading = false,
}: NewDocumentModalProps) {
  const isEditMode = !!editDocumentId
  const { t } = useT('translation')
  const locale = useLocale()
  const { userId, currentUser } = useAuth()
  const userIdForApi = userId ?? currentUser?.userId ?? ''

  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [issuedDate, setIssuedDate] = useState<Date | undefined>(undefined)
  const [reference, setReference] = useState('')
  const [catalogues, setCatalogues] = useState<string[]>([])
  const [language, setLanguage] = useState<'EN' | 'FR'>('EN')
  const [headerJson, setHeaderJson] = useState('')
  const [footerJson, setFooterJson] = useState('')
  const [rawText, setRawText] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [ownerText, setOwnerText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const ignoreNextCreateCloseRef = useRef(false)

  const sortByTitle = locale.startsWith('fr') ? SORT_BY_TITLE_FR : SORT_BY_TITLE_EN

  const { data: catResponse } = useQuery({
    ...documentsMaterialsServiceListCategoriesOptions({
      path: { userId: userIdForApi },
      query: {
        page: '1',
        pageSize: '1000',
        searchKey: '',
        sortOrder: 'ASC',
        sortBy: sortByTitle,
      },
    }),
    enabled: !!userIdForApi && open,
  })

  const { data: typeResponse } = useQuery({
    ...documentsMaterialsServiceListPublishedDocumentTypesOptions({
      path: { userId: userIdForApi },
      query: { page: '1', pageSize: '1000' },
    }),
    enabled: !!userIdForApi && open,
  })

  const categories = useMemo(() => catResponse?.categories ?? [], [catResponse?.categories])
  const documentTypes = useMemo(() => typeResponse?.documentTypes ?? [], [typeResponse?.documentTypes])

  const typeOptions = useMemo(
    () =>
      documentTypes.map((dt) => {
        const label = dt.titles?.en ?? dt.titles?.fr ?? dt.id ?? ''
        return { id: dt.id ?? '', label }
      }),
    [documentTypes]
  )

  const catalogueOptions = useMemo(
    () =>
      categories.map((c) => {
        const label = c.titles?.en ?? c.titles?.fr ?? c.categoryId ?? ''
        return { id: c.categoryId ?? '', label }
      }),
    [categories]
  )

  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()

  useEffect(() => {
    if (!open) return
    if (!isEditMode) {
      setTitle('')
      setType('')
      setIssuedDate(undefined)
      setReference('')
      setCatalogues([])
      setLanguage('EN')
      setHeaderJson('')
      setFooterJson('')
      setRawText('')
      setSourceLink('')
      setOwnerText('')
      setErrors({})
      return
    }
    if (!editDocument) return

    const doc = editDocument
    setTitle(doc.title ?? '')
    setReference(doc.ref ?? '')

    const typeId = String(
      doc.document_type?.id ?? doc.documentType?.id ?? doc.documentTypeId ?? ''
    )
    const typeExists = typeOptions.some((o) => String(o.id) === typeId)
    setType(typeExists ? typeId : String(typeOptions[0]?.id ?? typeId))

    setLanguage(
      (doc.language?.toUpperCase().slice(0, 2) === 'FR' ? 'FR' : 'EN') as 'EN' | 'FR'
    )

    const headerJsonRaw = doc.json_header ?? doc.jsonHeader ?? ''
    const footerJsonRaw = doc.json_footer ?? doc.jsonFooter ?? ''
    setHeaderJson(
      headerJsonRaw?.trim() && headerJsonRaw !== '{}' ? headerJsonRaw : ''
    )
    setFooterJson(
      footerJsonRaw?.trim() && footerJsonRaw !== '{}' ? footerJsonRaw : ''
    )

    const rawTextVal = doc.raw_text ?? doc.rawText ?? ''
    setRawText(rawTextVal)

    const issueDateStr = doc.issue_date ?? doc.issueDate
    if (issueDateStr) {
      try {
        const d = new Date(issueDateStr)
        if (!Number.isNaN(d.getTime())) setIssuedDate(d)
        else setIssuedDate(undefined)
      } catch {
        setIssuedDate(undefined)
      }
    } else {
      setIssuedDate(undefined)
    }

    const categoryIdList: string[] =
      doc.category_ids ??
      doc.categoryIds ??
      (doc.categories ?? []).map(
        (c) => (c as { categoryId?: string; category_id?: string }).categoryId ??
          (c as { categoryId?: string; category_id?: string }).category_id ??
          ''
      ).filter(Boolean)
    const validCatalogueIds = categoryIdList.filter((id) =>
      catalogueOptions.some((o) => String(o.id) === String(id))
    )
    setCatalogues(validCatalogueIds)

    const sourceVal = doc.source
    setSourceLink(
      typeof sourceVal === 'string'
        ? sourceVal
        : Array.isArray(sourceVal) && sourceVal.length > 0
          ? String(sourceVal[0])
          : ''
    )

    const notes = doc.owners_notes ?? doc.ownersNotes ?? []
    const ownerLines = Array.isArray(notes)
      ? (notes as { msg?: string; name?: string }[])
          .map((n) => n.msg ?? n.name ?? '')
          .filter(Boolean)
      : []
    setOwnerText(ownerLines.join('\n'))

    setErrors({})
  }, [open, isEditMode, editDocument, typeOptions, catalogueOptions])

  const getTypeLabel = useCallback(
    (typeId: string) => {
      const dt = documentTypes.find((d) => d.id === typeId)
      if (!dt) return typeId
      return dt.titles?.en ?? dt.titles?.fr ?? typeId
    },
    [documentTypes]
  )

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = t('admin.newDocument.validationRequired')
    if (!type) next.type = t('admin.newDocument.validationRequired')
    if (!issuedDate) next.issuedDate = t('admin.newDocument.validationRequired')
    if (!reference.trim()) next.reference = t('admin.newDocument.validationRequired')
    if (!catalogues.length) next.catalogues = t('admin.newDocument.validationCataloguesRequired')
    if (!headerJson?.trim() || headerJson.trim() === '{}') next.header = t('admin.newDocument.validationRequired')
    if (!footerJson?.trim() || footerJson.trim() === '{}') next.footer = t('admin.newDocument.validationRequired')
    if (!rawText.trim()) next.rawText = t('admin.newDocument.validationRequired')
    if (!sourceLink.trim()) next.sourceLink = t('admin.newDocument.validationRequired')
    else {
      try {
        new URL(sourceLink.trim())
      } catch {
        next.sourceLink = t('admin.newDocument.validationSourceUrl')
      }
    }
    return next
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    const issueDateStr = issuedDate ? format(issuedDate, 'yyyy-MM-dd') : ''
    const payload = buildDocumentBody({
      ref: reference.trim(),
      title: title.trim(),
      issueDate: issueDateStr,
      categoryIds: catalogues,
      documentTypeId: type,
      documentTypeName: getTypeLabel(type),
      language,
      jsonHeader: headerJson,
      jsonFooter: footerJson,
      rawText: rawText.trim(),
      source: sourceLink.trim() ? [sourceLink.trim()] : [],
      ownersNotes: ownerText.trim() ? [ownerText.trim()] : undefined,
      status: 'inProgress',
    })

    const onSuccess = () => {
      onOpenChange(false)
      setTitle('')
      setType('')
      setIssuedDate(undefined)
      setReference('')
      setCatalogues([])
      setHeaderJson('')
      setFooterJson('')
      setRawText('')
      setSourceLink('')
      setOwnerText('')
      onSubmit?.({
        title,
        type,
        issuedDate,
        reference,
        catalogues,
        language,
        headerJson,
        footerJson,
        rawText,
        sourceLink,
        ownerText,
      })
    }

    if (isEditMode && editDocumentId) {
      updateDocument.mutate(
        { id: editDocumentId, payload },
        {
          onSuccess,
          onError: (err) => {
            const msg = getAxiosErrorMessage(err)
            setErrors({
              form: msg?.trim() ? msg : t('admin.newDocument.updateError'),
            })
          },
        }
      )
    } else {
      createDocument.mutate(payload, {
        onSuccess,
        onError: (err) => {
          const msg = getAxiosErrorMessage(err)
          setErrors({
            form: msg?.trim() ? msg : t('admin.newDocument.createError'),
          })
        },
      })
    }
  }

  const openPreview = () => {
    ignoreNextCreateCloseRef.current = true
    setPreviewOpen(true)
  }

  const handleCreateOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === false && ignoreNextCreateCloseRef.current) {
        ignoreNextCreateCloseRef.current = false
        return
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const handlePreviewOpenChange = useCallback((nextOpen: boolean) => {
    setPreviewOpen(nextOpen)
  }, [])

  return (
    <>
    <Dialog open={open} onOpenChange={handleCreateOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-[90vw] w-full flex-col gap-4 overflow-hidden sm:max-w-5xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditMode ? t('admin.newDocument.editTitle') : t('admin.newDocument.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {editDocumentLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {t('admin.newDocument.loading')}
            </div>
          )}
          {!editDocumentLoading && (
            <>
              {errors.form && (
                <p className="text-destructive text-sm px-1" role="alert">
                  {errors.form}
                </p>
              )}
              {/* Scrollable body: rows/columns collapse to single column on small screens */}
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-1">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              {/* Column 1: details + header + footer */}
              <div className="flex flex-col gap-4 lg:gap-6">
                {/* Row 1: title | reference | Row 2: type | catalogues | Row 3: issued date | language */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="doc-title">
                      {t('admin.newDocument.titleLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value)
                        if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
                      }}
                      placeholder={t('admin.newDocument.titlePlaceholder')}
                      className={errors.title ? 'border-destructive' : ''}
                      required
                    />
                    {errors.title && (
                      <p className="text-destructive text-xs">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="doc-reference">
                      {t('admin.newDocument.referenceLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                      id="doc-reference"
                      value={reference}
                      onChange={(e) => {
                        setReference(e.target.value)
                        if (errors.reference) setErrors((prev) => ({ ...prev, reference: '' }))
                      }}
                      placeholder={t('admin.newDocument.referencePlaceholder')}
                      className={errors.reference ? 'border-destructive' : ''}
                      required
                    />
                    {errors.reference && (
                      <p className="text-destructive text-xs">{errors.reference}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-type">
                      {t('admin.newDocument.typeLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        setType(v)
                        if (errors.type) setErrors((prev) => ({ ...prev, type: '' }))
                      }}
                      required
                    >
                      <SelectTrigger
                        id="doc-type"
                        className={cn('w-full', errors.type && 'border-destructive')}
                      >
                        <SelectValue placeholder={t('admin.newDocument.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-destructive text-xs">{errors.type}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-catalogues" className="cursor-pointer">
                      {t('admin.newDocument.cataloguesLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <MultiSelect
                      id="doc-catalogues"
                      options={catalogueOptions}
                      value={catalogues}
                      onChange={(v) => {
                        setCatalogues(v)
                        if (errors.catalogues) setErrors((prev) => ({ ...prev, catalogues: '' }))
                      }}
                      placeholder={t('admin.newDocument.cataloguesPlaceholder')}
                      maxShow={2}
                      triggerClassName={errors.catalogues ? 'border-destructive' : ''}
                    />
                    {errors.catalogues && (
                      <p className="text-destructive text-xs">{errors.catalogues}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-issued">
                      {t('admin.newDocument.issuedDateLabel')}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="doc-issued"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !issuedDate && 'text-muted-foreground',
                            errors.issuedDate && 'border-destructive'
                          )}
                          onClick={() => errors.issuedDate && setErrors((prev) => ({ ...prev, issuedDate: '' }))}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {issuedDate ? format(issuedDate, 'PPP') : t('admin.newDocument.issuedDatePlaceholder')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={issuedDate}
                          onSelect={(d) => {
                            setIssuedDate(d)
                            if (d && errors.issuedDate) setErrors((prev) => ({ ...prev, issuedDate: '' }))
                            setDatePickerOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.issuedDate && (
                      <p className="text-destructive text-xs">{errors.issuedDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-language">{t('admin.newDocument.languageLabel')}</Label>
                    <Select
                      value={language}
                      onValueChange={(v) => setLanguage(v as 'EN' | 'FR')}
                    >
                      <SelectTrigger id="doc-language" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">{t('admin.newDocument.languageEN')}</SelectItem>
                        <SelectItem value="FR">{t('admin.newDocument.languageFR')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Header rich text (full editor like notes) */}
                <div className="space-y-1">
                  <RichTextEditorBlock
                    key={isEditMode && editDocument ? `header-${editDocumentId}-loaded` : 'header-new'}
                    label={t('admin.newDocument.headerLabel')}
                    value={headerJson}
                    onChange={(v) => {
                      setHeaderJson(v)
                      if (errors.header) setErrors((prev) => ({ ...prev, header: '' }))
                    }}
                    required
                  />
                  {errors.header && (
                    <p className="text-destructive text-xs">{errors.header}</p>
                  )}
                </div>

                {/* Row 3: Footer rich text (full editor like notes) */}
                <div className="space-y-1">
                  <RichTextEditorBlock
                    key={isEditMode && editDocument ? `footer-${editDocumentId}-loaded` : 'footer-new'}
                    label={t('admin.newDocument.footerLabel')}
                    value={footerJson}
                    onChange={(v) => {
                      setFooterJson(v)
                      if (errors.footer) setErrors((prev) => ({ ...prev, footer: '' }))
                    }}
                    required
                  />
                  {errors.footer && (
                    <p className="text-destructive text-xs">{errors.footer}</p>
                  )}
                </div>
              </div>

              {/* Column 2: raw text, source, owner – stacks below on mobile */}
              <div className="flex flex-col gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="doc-raw">
                  {t('admin.newDocument.rawTextLabel')}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Textarea
                  id="doc-raw"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value)
                    if (errors.rawText) setErrors((prev) => ({ ...prev, rawText: '' }))
                  }}
                  placeholder={t('admin.newDocument.rawTextPlaceholder')}
                  className={cn('min-h-[120px] lg:min-h-[140px]', errors.rawText && 'border-destructive')}
                  required
                />
                {errors.rawText && (
                  <p className="text-destructive text-xs">{errors.rawText}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-source">
                  {t('admin.newDocument.sourceLinkLabel')}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  id="doc-source"
                  type="url"
                  value={sourceLink}
                  onChange={(e) => {
                    setSourceLink(e.target.value)
                    if (errors.sourceLink) setErrors((prev) => ({ ...prev, sourceLink: '' }))
                  }}
                  onBlur={() => {
                    const trimmed = sourceLink.trim()
                    if (!trimmed) {
                      setErrors((prev) => ({ ...prev, sourceLink: '' }))
                      return
                    }
                    try {
                      new URL(trimmed)
                      setErrors((prev) => ({ ...prev, sourceLink: '' }))
                    } catch {
                      setErrors((prev) => ({ ...prev, sourceLink: t('admin.newDocument.validationSourceUrl') }))
                    }
                  }}
                  placeholder="https://..."
                  className={errors.sourceLink ? 'border-destructive' : ''}
                  required
                />
                {errors.sourceLink && (
                  <p className="text-destructive text-xs">{errors.sourceLink}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-owner">{t('admin.newDocument.ownerTextLabel')}</Label>
                <Textarea
                  id="doc-owner"
                  value={ownerText}
                  onChange={(e) => setOwnerText(e.target.value)}
                  placeholder={t('admin.newDocument.ownerTextPlaceholder')}
                  className="min-h-[72px] lg:min-h-[80px]"
                />
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={openPreview}>
              {t('admin.newDocument.preview')}
            </Button>
            <Button
              type="submit"
              disabled={createDocument.isPending || updateDocument.isPending}
            >
              {createDocument.isPending || updateDocument.isPending ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                  {t('common.saving')}
                </>
              ) : isEditMode ? (
                t('admin.newDocument.save')
              ) : (
                t('admin.newDocument.create')
              )}
            </Button>
          </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>

    <DocumentPreviewModal
      open={previewOpen}
      onOpenChange={handlePreviewOpenChange}
      data={
        previewOpen
          ? {
              title,
              type,
              issuedDate,
              reference,
              catalogues,
              language,
              headerJson,
              footerJson,
              rawText,
              sourceLink,
              ownerText,
            }
          : null
      }
      getTypeLabel={getTypeLabel}
    />
    </>
  )
}
