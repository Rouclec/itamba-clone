'use client'

import { useParams } from 'next/navigation'

export function useLocale(): string {
  const params = useParams()
  const locale = params?.locale as string | undefined
  if (typeof locale !== 'string') return 'en'
  return locale
}

/**
 * Use for router.push/replace: prepends current locale to path.
 * path should be like "/auth/signin" or "/admin" (leading slash).
 */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale()
  return (path: string) => {
    const p = path.startsWith('/') ? path : `/${path}`
    return `/${locale}${p}`
  }
}
