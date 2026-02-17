import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import acceptLanguage from 'accept-language'
import { fallbackLocale, locales, cookieName, headerName } from './app/i18n/settings'

acceptLanguage.languages([...locales])

function getLocaleFromRequest(req: NextRequest): string {
  const cookie = req.cookies.get(cookieName)?.value
  if (cookie && locales.includes(cookie as 'en' | 'fr')) return cookie
  const acceptLang = req.headers.get('Accept-Language')
  const preferred = acceptLang ? acceptLanguage.get(acceptLang) : null
  if (preferred && locales.includes(preferred as 'en' | 'fr')) return preferred
  return fallbackLocale
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon' ||
    pathname.includes('icon') ||
    pathname.includes('apple-icon') ||
    pathname.includes('site.webmanifest')
  ) {
    return NextResponse.next()
  }

  const localeInPath = locales.find((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`))
  const headers = new Headers(request.headers)
  const locale = localeInPath ?? getLocaleFromRequest(request)
  headers.set(headerName, locale)

  if (!localeInPath) {
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
    const url = new URL(newPath + request.nextUrl.search, request.url)
    const res = NextResponse.redirect(url)
    res.cookies.set(cookieName, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }

  const res = NextResponse.next({ headers })
  res.cookies.set(cookieName, localeInPath, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return res
}
