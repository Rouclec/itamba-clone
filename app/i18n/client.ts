'use client'

import i18next from './i18next'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function useT(ns: string | string[] = 'translation', options?: { keyPrefix?: string }) {
  const params = useParams()
  const locale = params?.locale as string | undefined

  if (typeof locale !== 'string') {
    throw new Error('useT is only available inside app/[locale] routes')
  }

  // Only sync language on the client. On the server we rely on lng: locale in useTranslation
  // so we don't call changeLanguage (it creates async context and can exhaust Next.js AsyncHook Map).
  if (typeof window !== 'undefined') {
    const [, setActiveLocale] = useState(i18next.resolvedLanguage)
    useEffect(() => {
      if (!locale || i18next.resolvedLanguage === locale) return
      i18next.changeLanguage(locale).then(() => setActiveLocale(locale))
    }, [locale])
  }

  return useTranslation(ns, { ...options, lng: locale })
}
