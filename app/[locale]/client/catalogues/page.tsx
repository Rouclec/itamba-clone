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
import { CataloguesPageContent } from '@/components/client-library/catalogues-page-content'

/**
 * Catalogues dashboard at /client/catalogues. All users with at least one catalogue
 * can see the list. Only users with 0 catalogues see the restriction modal.
 */
export default function ClientCataloguesPage() {
  const router = useRouter()
  const path = useLocalePath()
  const { t } = useT('translation')
  const { currentUser, user } = useAuth()
  const role = currentUser?.userRole ?? user?.role ?? undefined
  const userId = currentUser?.userId ?? undefined
  const { cataloguesLimit } = useRestrictions(role, userId)
  const hasAccess = cataloguesLimit === -1 || cataloguesLimit > 0

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-6">
        <CataloguesPageContent />
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
