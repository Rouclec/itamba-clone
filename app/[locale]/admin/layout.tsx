'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'
import { isAdminRole } from '@/utils/auth/role'
import { AdminLayout as AdminShell } from '@/components/admin/admin-layout'
import { AdminHeader } from '@/components/admin/admin-header'
import { LibraryFooter } from '@/components/client-library/library-footer'

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

  if (!isAdminRole(user.role)) {
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

  return (
    <AdminShell>
      <AdminHeader />
      <div className="flex-1 min-h-0 flex flex-col bg-[#F9F9F9]">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </div>
        <div className="shrink-0">
          <LibraryFooter />
        </div>
      </div>
    </AdminShell>
  )
}
