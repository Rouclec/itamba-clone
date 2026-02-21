'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, ChevronRight } from 'lucide-react'
import { MdLanguage, MdKeyboardArrowDown } from 'react-icons/md'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'
import { AdminSidebarTrigger } from './admin-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import i18next from '@/app/i18n/i18next'
import { getAdminRoleDisplayLabel } from '@/utils/auth/role'

function avatarLabel(currentUser: { fullName?: string; email?: string; telephone?: string } | null) {
  const s = currentUser?.fullName ?? currentUser?.email ?? currentUser?.telephone ?? ''
  return s.slice(0, 2).toUpperCase() || 'AD'
}

function getAdminHeaderFromPath(pathname: string | null, t: (key: string) => string): { title: string; subtitle: string } {
  if (!pathname) return { title: t('admin.title'), subtitle: '' }
  if (pathname.includes('/admin')) return { title: '', subtitle: '' }
  return { title: t('admin.title'), subtitle: '' }
}

export function AdminHeader() {
  const { currentUser, user, signOut } = useAuth()
  const { t, i18n } = useT('translation')
  const router = useRouter()
  const pathname = usePathname()
  const locale = i18n.language ?? 'en'
  const { title, subtitle } = getAdminHeaderFromPath(pathname, t)
  const roleLabel = getAdminRoleDisplayLabel(currentUser?.userRole ?? user?.role ?? null)

  function switchLocale() {
    const newLocale = locale === 'en' ? 'fr' : 'en'
    const newPath = pathname?.replace(/^\/[a-z]{2}/, `/${newLocale}`) ?? `/${newLocale}`
    i18next.changeLanguage(newLocale)
    router.push(newPath)
  }

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-white px-4 md:px-6">
      <AdminSidebarTrigger className="shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            ) : null}
          </>
        ) : null}
      </div>
      <Button variant="outline" size="sm" asChild>
        <LocaleLink href="/client" className="gap-2">
          {t('admin.goToLibrary')}
        </LocaleLink>
      </Button>
      <button
        type="button"
        onClick={switchLocale}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#64748B] hover:bg-hover hover:text-foreground uppercase"
        aria-label={locale === 'fr' ? 'Switch to English' : 'Switch to French'}
      >
        <MdLanguage className="size-4" />
        <span>{locale === 'fr' ? 'FR' : 'EN'}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-hover min-w-0"
          >
            <Avatar className="size-8 shrink-0 rounded-full bg-primary/20">
              <AvatarFallback className="rounded-full bg-primary/20 text-primary text-sm">
                {avatarLabel(currentUser)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left min-w-0 md:block">
              <div className="flex items-center gap-1 text-sm font-medium truncate">
                {currentUser?.fullName ?? currentUser?.email ?? currentUser?.telephone ?? user?.identifier ?? 'Admin'}
              </div>
              <div className="text-xs text-tertiary font-medium">{roleLabel}</div>
            </div>
            <MdKeyboardArrowDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-0">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-full bg-primary/20">
                <AvatarFallback className="rounded-full bg-primary/20 text-primary">
                  {avatarLabel(currentUser)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{currentUser?.fullName ?? 'Admin'}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentUser?.email ?? currentUser?.telephone ?? '—'}
                </p>
                <span className="inline-flex items-center rounded-md bg-surface px-1.5 py-0.5 text-xs font-medium">
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={switchLocale}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-hover hover:text-foreground"
            >
              <span>{locale === 'fr' ? 'Français' : 'English'}</span>
              <ChevronRight className="size-4" />
            </button>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-600 focus:bg-surface focus:text-foreground data-highlighted:bg-surface data-highlighted:text-foreground"
            >
              <LogOut className="size-4 text-red-500" />
              {t('admin.signOut')}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
