'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Check, Settings, LogOut, ChevronRight, UserPen } from 'lucide-react'
import { MdLanguage, MdKeyboardArrowDown } from 'react-icons/md'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'
import { SidebarTrigger } from './client-library-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import i18next from '@/app/i18n/i18next'

function avatarLabel(currentUser: { fullName?: string; email?: string; telephone?: string } | null) {
  const s = currentUser?.fullName ?? currentUser?.email ?? currentUser?.telephone ?? ''
  return s.slice(0, 2).toUpperCase() || 'U'
}

export function LibraryHeader() {
  const { currentUser, signOut } = useAuth()
  const { t, i18n } = useT('translation')
  const router = useRouter()
  const pathname = usePathname()
  const locale = i18n.language ?? 'en'

  function switchLocale() {
    const newLocale = locale === 'en' ? 'fr' : 'en'
    const newPath = pathname.replace(/^\/[a-z]{2}/, `/${newLocale}`)
    i18next.changeLanguage(newLocale)
    router.push(newPath)
  }

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-white px-4 md:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="min-w-0 flex-1" />
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
                {currentUser?.fullName ?? currentUser?.email ?? currentUser?.telephone ?? '—'}
                <Check className="size-4 shrink-0 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">{t('client.freePlan')}</div>
            </div>
            <MdKeyboardArrowDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 p-0 **:data-[slot=dropdown-menu-item]:focus:bg-surface **:data-[slot=dropdown-menu-item]:focus:text-foreground **:data-[slot=dropdown-menu-item]:data-highlighted:bg-surface **:data-[slot=dropdown-menu-item]:data-highlighted:text-foreground"
        >
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-full bg-primary/20">
                <AvatarFallback className="rounded-full bg-primary/20 text-primary">
                  {avatarLabel(currentUser)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{currentUser?.fullName ?? '—'}</p>
                <p className="text-sm text-muted-foreground truncate">{currentUser?.email ?? currentUser?.telephone ?? '—'}</p>
                <span className="inline-flex items-center rounded-md bg-surface px-1.5 py-0.5 text-xs font-medium">
                  {t('client.freePlan')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                switchLocale()
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-hover hover:text-foreground"
            >
              <span>{locale === 'fr' ? 'Français' : 'English'}</span>
              <ChevronRight className="size-4" />
            </button>
            <DropdownMenuItem asChild>
              <LocaleLink
                href="/client/settings"
                className="flex cursor-pointer items-center gap-2 focus:bg-surface focus:text-foreground data-highlighted:bg-surface data-highlighted:text-foreground"
              >
                <Settings className="size-4 text-body-text" />
                {t('client.settings')}
              </LocaleLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <LocaleLink
                href="/profile/complete"
                className="flex cursor-pointer items-center gap-2 focus:bg-surface focus:text-foreground data-highlighted:bg-surface data-highlighted:text-foreground"
              >
                <UserPen className="size-4 text-body-text" />
                {t('auth.completeProfile')}
              </LocaleLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-600 focus:bg-surface focus:text-foreground data-highlighted:bg-surface data-highlighted:text-foreground"
            >
              <LogOut className="size-4 text-red-500" />
              {t('client.logOut')}
            </DropdownMenuItem>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t('client.upgradeForUnlimited')}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
