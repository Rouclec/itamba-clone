'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { RestrictionModal, getRestrictionCopy } from '@/components/restriction-modal'
import { GUEST_FIRST_LOGIN_MODAL_SEEN_KEY } from '@/utils/auth/session'
import { getRoleSlug } from '@/utils/auth/role'

export function GuestFirstLoginModal() {
  const router = useRouter()
  const path = useLocalePath()
  const { user, currentUser, hydrated } = useAuth()
  const { t } = useT('translation')
  const [open, setOpen] = useState(false)
  const role = currentUser?.userRole ?? user?.role
  const isGuest = getRoleSlug(role) === 'guest'

  useEffect(() => {
    if (!hydrated || !isGuest) return
    try {
      const seen = localStorage.getItem(GUEST_FIRST_LOGIN_MODAL_SEEN_KEY)
      if (seen === 'true') return
      setOpen(true)
    } catch {
      // ignore
    }
  }, [hydrated, isGuest])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      try {
        localStorage.setItem(GUEST_FIRST_LOGIN_MODAL_SEEN_KEY, 'true')
      } catch {
        // ignore
      }
    }
  }

  const copy = getRestrictionCopy('first-login', t)

  if (!isGuest) return null

  return (
    <RestrictionModal
      open={open}
      onOpenChange={handleOpenChange}
      variant="first-login"
      titleLine1={copy.titleLine1}
      titleLine2={copy.titleLine2}
      body={copy.body}
      ctaText={copy.ctaText}
      imageOverlay={copy.imageOverlay}
      onUpgrade={() => {
        router.push(path('/subscription'))
      }}
      imageSrc="/assets/free-limited-bg.png"
    />
  )
}
