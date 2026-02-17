import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import acceptLanguage from 'accept-language'
import { fallbackLocale, locales, cookieName, headerName } from './app/i18n/settings'
import { isAdminRole } from '@/utils/auth/role'

acceptLanguage.languages([...locales])

const TOKEN_COOKIE = 'token'

/** Decode JWT payload without verification (read-only for role). Safe for Edge. */
function decodeJwtPayload(token: string): { user_role?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json) as { user_role?: string }
  } catch {
    return null
  }
}

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
  const localeSegment = pathname.split('/')[1]
  const secondSegment = pathname.split('/')[2]
  const isAdminPath = secondSegment === 'admin'
  const isClientPath = secondSegment === 'client'

  // Role-based auth: only run when we have a locale in path (e.g. /en/admin, /fr/client)
  if (localeInPath && (isAdminPath || isClientPath)) {
    const token = request.cookies.get(TOKEN_COOKIE)?.value
    const payload = token ? decodeJwtPayload(token) : null
    const userRole = payload?.user_role
    const isAdmin = isAdminRole(userRole)

    if (!token || !payload) {
      const signIn = new URL(`/${localeSegment}/auth/signin`, request.url)
      signIn.searchParams.set('from', pathname)
      return NextResponse.redirect(signIn)
    }
    if (isAdminPath && !isAdmin) {
      return NextResponse.redirect(new URL(`/${localeSegment}/client`, request.url))
    }
    if (isClientPath && isAdmin) {
      return NextResponse.redirect(new URL(`/${localeSegment}/admin`, request.url))
    }
  }

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
