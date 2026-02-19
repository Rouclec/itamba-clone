'use client'

import { useAuth } from '@/lib/auth-context'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { LocaleLink } from '@/components/locale-link'

export default function AdminPage() {
  const { user, signOut } = useAuth()
  const { t } = useT('translation')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-primary">{t('admin.title')}</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <LocaleLink href="/client">{t('admin.goToLibrary')}</LocaleLink>
            </Button>
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t('admin.signOut')}
            </button>
          </div>
        </div>
        <p className="text-muted-foreground">
          {t('admin.signedInAs')} <span className="text-foreground font-medium">{user?.identifier}</span> {t('admin.adminRole')}
        </p>
        <p className="text-muted-foreground mt-2">
          {t('admin.adminAreaDescription')}
        </p>
      </div>
    </div>
  )
}
