'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/use-locale'

type LocaleLinkProps = React.ComponentProps<typeof Link> & {
  href: string
}

/**
 * Link that prepends the current locale to href.
 * Use for internal routes: href="/auth/signup" -> /en/auth/signup or /fr/auth/signup
 */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale()
  const isExternal = href.startsWith('http') || href.startsWith('//')
  const isAnchor = href.startsWith('#')
  const localizedHref = isExternal || isAnchor ? href : `/${locale}${href.startsWith('/') ? href : `/${href}`}`
  return <Link href={localizedHref} {...props} />
}
