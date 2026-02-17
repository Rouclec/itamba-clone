'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { ClientLibraryLayout } from '@/components/client-library/client-library-layout'
import { LibraryHeader } from '@/components/client-library/library-header'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, hydrated } = useAuth()
  const router = useRouter()
  const path = useLocalePath()
  const { t } = useT('translation')

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace(path('/auth/signin'))
    }
  }, [hydrated, user, router, path])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">{t('common.loading')}</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ClientLibraryLayout header={<LibraryHeader />}>
      {children}
    </ClientLibraryLayout>
  )
}
