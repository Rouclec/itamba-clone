'use client'

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type RestrictionVariant = 'first-login' | 'documents-limit' | 'catalogues-limit' | 'bookmarks-limit' | 'notes-limit'

/** Bottom overlay on the left image: line (yellow/orange) and title (white). */
export interface RestrictionImageOverlay {
  /** e.g. "current plan" → displayed as "---- current plan ----" in amber */
  lineText: string
  /** e.g. "FREE PLAN" or "Documents" in white */
  title: string
}

export interface RestrictionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: RestrictionVariant
  /** For documents-limit / catalogues-limit: the limit number. Omitted for first-login. */
  limit?: number
  titleLine1: string
  titleLine2: string
  body: string
  ctaText: string
  onUpgrade?: () => void
  /**
   * Called whenever the modal is closed (X, overlay, Escape, or "Upgrade").
   * Use for "close then go back" flows: e.g. onClose={() => router.replace('/client')}
   * so that closing the modal redirects the user instead of staying on the restricted screen.
   */
  onClose?: () => void
  /** Optional image URL for the left panel. When not set, a gradient is shown. */
  imageSrc?: string
  /** Text overlay at the bottom of the left panel (line in amber, title in white). */
  imageOverlay?: RestrictionImageOverlay
}


export function RestrictionModal({
  open,
  onOpenChange,
  titleLine1,
  titleLine2,
  body,
  ctaText,
  onUpgrade,
  onClose,
  imageSrc = '/assets/restriction-bg.png',
  imageOverlay,
}: RestrictionModalProps) {
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="flex w-[90vw] sm:max-w-[700px] flex-col p-0 gap-0 overflow-hidden rounded-lg border-0 shadow-lg sm:flex-row sm:items-stretch"
      >
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row sm:items-stretch sm:min-w-0">
          {/* Left: full width on mobile, 300px on sm+; stretches to full height */}
          <div
            className="relative h-44 w-full shrink-0 sm:min-h-[280px] sm:h-full sm:w-[300px]"
            style={{
              background: imageSrc
                ? undefined
                : 'linear-gradient(to bottom, #00000000 0%, #00000000 28%, #9A33FD66 60%, #9A33FD66 67%, #4135BBC7 80%, #0D3695 100%)',
            }}
          >
            {imageSrc && (
              <>
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="300px"
                />
                <div
                  className="absolute inset-0 bg-linear-to-t from-[#17188B]/90 via-transparent to-transparent"
                  aria-hidden
                />
              </>
            )}
            {imageOverlay && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-4 text-left">
                {/* Solid line on both sides of the text */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-accent-yellow" aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-yellow shrink-0">
                    {imageOverlay.lineText}
                  </span>
                  <div className="h-px flex-1 bg-accent-yellow" aria-hidden />
                </div>
                <p className="text-sm font-bold text-white sm:text-base uppercase">
                  {imageOverlay.title}
                </p>
              </div>
            )}
          </div>

          {/* Right: content; fill height so button can align with left overlay */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white p-4 text-left">
            <DialogTitle className="sr-only">
              {titleLine1} {titleLine2}
            </DialogTitle>
            <DialogDescription className="sr-only">{body}</DialogDescription>

            <div className="flex min-h-0 flex-1 flex-col pt-2 sm:pt-10 text-left">
              <div className="min-h-0 flex-1 overflow-auto">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-body-text text-xl font-bold leading-tight">
                      {titleLine1}
                    </p>
                    <p className="text-tertiary text-xl font-bold leading-tight sm:text-2xl">
                      {titleLine2}
                    </p>
                  </div>
                  <p className="text-muted font-normal leading-relaxed">{body}</p>
                </div>
              </div>
              <div className="shrink-0 pt-16">
                <Button
                  onClick={() => {
                    onUpgrade?.()
                    handleOpenChange(false)
                  }}
                  className="w-fit rounded-md bg-[#17188B] px-6 text-white hover:bg-[#17188B]/90"
                >
                  {ctaText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Default copy and image overlay for each variant. Pass t() from useT. */
export function getRestrictionCopy(
  variant: RestrictionVariant,
  t: (key: string) => string,
  limit?: number
): {
  titleLine1: string
  titleLine2: string
  body: string
  ctaText: string
  imageOverlay: RestrictionImageOverlay
} {
  switch (variant) {
    case 'first-login':
      return {
        titleLine1: t('restriction.firstLoginTitle1'),
        titleLine2: t('restriction.firstLoginTitle2'),
        body: t('restriction.firstLoginBody'),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.currentPlanLine'),
          title: t('restriction.freePlan'),
        },
      }
    case 'documents-limit':
      return {
        titleLine1: t('restriction.documentsLimitTitle1'),
        titleLine2: t('restriction.documentsLimitTitle2'),
        body: t('restriction.documentsLimitBody').replace('{{count}}', String(limit ?? 0)),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.premiumFeatureLine'),
          title: t('restriction.featureDocuments'),
        },
      }
    case 'catalogues-limit':
      return {
        titleLine1: t('restriction.cataloguesLimitTitle1'),
        titleLine2: t('restriction.cataloguesLimitTitle2'),
        body: t('restriction.cataloguesLimitBody'),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.premiumFeatureLine'),
          title: t('restriction.featureCatalogues'),
        },
      }
    case 'bookmarks-limit':
      return {
        titleLine1: t('restriction.bookmarksLimitTitle1'),
        titleLine2: t('restriction.bookmarksLimitTitle2'),
        body: t('restriction.bookmarksLimitBody').replace('{{count}}', String(limit ?? 0)),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.premiumFeatureLine'),
          title: t('restriction.featureBookmarks'),
        },
      }
    case 'notes-limit':
      return {
        titleLine1: t('restriction.notesLimitTitle1'),
        titleLine2: t('restriction.notesLimitTitle2'),
        body: t('restriction.notesLimitBody').replace('{{count}}', String(limit ?? 0)),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.premiumFeatureLine'),
          title: t('restriction.featureNotes'),
        },
      }
    default:
      return {
        titleLine1: t('restriction.firstLoginTitle1'),
        titleLine2: t('restriction.firstLoginTitle2'),
        body: t('restriction.firstLoginBody'),
        ctaText: t('restriction.upgradeNow'),
        imageOverlay: {
          lineText: t('restriction.currentPlanLine'),
          title: t('restriction.freePlan'),
        },
      }
  }
}
