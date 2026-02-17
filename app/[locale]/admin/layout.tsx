'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'

export default function AdminLayout({
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
      return
    }
    // If user.role !== 'admin', layout renders restricted view below
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

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <ShieldX className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">{t('admin.accessRestricted')}</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          {t('admin.noPermission')}
        </p>
        <Button
          onClick={() => router.push(path('/client'))}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('admin.goToLibrary')}
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
