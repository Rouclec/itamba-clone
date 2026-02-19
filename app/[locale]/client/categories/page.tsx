'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { useRestrictions } from '@/hooks/use-restrictions'
import {
  RestrictionModal,
  getRestrictionCopy,
} from '@/components/restriction-modal'

/**
 * Categories (catalogues) screen. Users with a finite catalogues limit
 * (e.g. guest, student) see the restriction modal and are redirected
 * to the library home when they close it. Direct URL and nav click
 * are both handled here.
 */
export default function ClientCategoriesPage() {
  const router = useRouter()
  const path = useLocalePath()
  const { t } = useT('translation')
  const { currentUser } = useAuth()
  const role = currentUser?.userRole ?? undefined
  const userId = currentUser?.userId ?? undefined
  const { cataloguesLimit } = useRestrictions(role, userId)
  const hasAccess = cataloguesLimit === -1

  const redirectToLibrary = () => {
    router.replace(path('/client'))
  }

  const copy = useMemo(
    () =>
      getRestrictionCopy(
        'catalogues-limit',
        t,
        cataloguesLimit >= 0 ? cataloguesLimit : undefined
      ),
    [t, cataloguesLimit]
  )

  if (hasAccess) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-primary">
          {t('librarySidebar.catalogues')}
        </h1>
        <p className="text-body-text">
          {t('client.cataloguesPlaceholder')}
        </p>
      </div>
    )
  }

  return (
    <RestrictionModal
      open={true}
      onOpenChange={() => {}}
      variant="catalogues-limit"
      limit={cataloguesLimit >= 0 ? cataloguesLimit : undefined}
      titleLine1={copy.titleLine1}
      titleLine2={copy.titleLine2}
      body={copy.body}
      ctaText={copy.ctaText}
      imageOverlay={copy.imageOverlay}
      onClose={redirectToLibrary}
      onUpgrade={redirectToLibrary}
    />
  )
}
