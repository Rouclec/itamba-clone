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

  const namespace = Array.isArray(ns) ? ns[0] : ns

  // Server: use getFixedT with sync-loaded bundles (no useTranslation = no loadLanguages = no AsyncHook overflow).
  // Server and client must render the same text to avoid hydration mismatch.
  if (typeof window === 'undefined') {
    const t = i18next.getFixedT(locale, namespace, options?.keyPrefix)
    return { t, i18n: i18next, ready: true }
  }

  // Client: sync language then use useTranslation
  const [, setActiveLocale] = useState(i18next.resolvedLanguage)
  useEffect(() => {
    if (!locale || i18next.resolvedLanguage === locale) return
    i18next.changeLanguage(locale).then(() => setActiveLocale(locale))
  }, [locale])

  return useTranslation(ns, { ...options, lng: locale })
}
