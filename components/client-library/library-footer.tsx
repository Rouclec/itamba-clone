'use client'

import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'

export function LibraryFooter() {
  const { t } = useT('translation')
  return (
    <footer className="border-t border-border px-4 py-3 md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
        <span>Itamba {t('client.copyright')}</span>
        <div className="flex gap-4">
          <LocaleLink href="#" className="hover:text-foreground">
            {t('client.privacyAndTerms')}
          </LocaleLink>
          <LocaleLink href="#" className="hover:text-foreground">
            {t('client.contactUs')}
          </LocaleLink>
        </div>
      </div>
    </footer>
  )
}
