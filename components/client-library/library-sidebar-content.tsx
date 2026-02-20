'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  MdOutlineLocalLibrary,
  MdOutlineTextSnippet,
  MdOutlineCategory,
  MdOutlineWidgets,
  MdOutlineReceiptLong,
  MdOutlineDashboard,
  MdOutlineReceipt,
  MdStarBorder,
  MdLockOutline,
  MdNotes,
  MdBookmarkBorder,
  MdOutlineFolder,
  MdHelpOutline,
  MdOutlineSettings,
  MdKeyboardArrowDown,
} from 'react-icons/md'
import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useRestrictions } from '@/hooks/use-restrictions'

const SIDEBAR_WIDTH = '16rem'

type SectionKey = 'library' | 'myDashboard'

export function LibrarySidebarContent() {
  const { t } = useT('translation')
  const { currentUser, user } = useAuth()
  const role = currentUser?.userRole ?? user?.role ?? undefined
  const userId = currentUser?.userId ?? undefined
  const { cataloguesLimit } = useRestrictions(role, userId)
  const canAccessCatalogues = cataloguesLimit === -1 || cataloguesLimit > 0
  const pathname = usePathname() ?? ''
  const cataloguesActive = pathname.includes('/client/catalogues')
  const bookmarksActive = pathname.includes('/client/bookmarks')
  const notesActive = pathname.includes('/client/notes')
  const documentsActive =
    pathname.includes('/client') &&
    !pathname.includes('/client/catalogues') &&
    !pathname.includes('/client/bookmarks') &&
    !pathname.includes('/client/notes')
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    library: true,
    myDashboard: true,
  })

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const navParentClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium justify-between'
  const navParentInactiveClass = 'text-[#64748B]'
  const navParentActiveClass = 'text-primary' // Library / My Dashboard when a child is active
  const navChildClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-hover'
  const navChildInactiveClass = 'text-[#64748B]'
  const navChildActiveClass = 'bg-surface text-primary'
  const navSiblingClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-hover hover:text-foreground'
  const childGroupClass = 'border-l border-border ml-3 pl-3 flex flex-col gap-0.5'

  return (
    <div className="flex h-full min-h-0 w-(--library-sidebar-width) flex-col overflow-y-auto overflow-x-hidden bg-white">
      {/* Logo + name — height matches header so the border line is straight */}
      <div className="flex h-20 shrink-0 items-center border-b border-border p-4">
        <LocaleLink href="/client" className="flex items-start gap-2">
          <div className="relative h-11 w-12 shrink-0">
            <Image
              src="/assets/logo.png"
              alt="Itamba"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <div className="font-extrabold leading-none text-2xl text-primary">
              Itamba
            </div>
            <div className="text-xs text-[#9A33FD] leading-tight">
              {t('signupLayout.legalLibrary')}
            </div>
          </div>
        </LocaleLink>
      </div>

      {/* Platform */}
      <div className="flex shrink-0 flex-col gap-1 p-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {t('librarySidebar.platform')}
        </p>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => toggleSection('library')}
            className={cn(
              navParentClass,
              (documentsActive || cataloguesActive) ? navParentActiveClass : navParentInactiveClass
            )}
            aria-expanded={openSections.library}
          >
            <span className="flex items-center gap-2">
              <MdOutlineLocalLibrary className="size-4" />
              {t('librarySidebar.library')}
            </span>
            <MdKeyboardArrowDown
              className={cn('size-4 shrink-0 transition-transform', !openSections.library && '-rotate-90')}
              aria-hidden
            />
          </button>
          {openSections.library && (
          <div className={childGroupClass}>
            <LocaleLink
              href="/client"
              className={cn(
                navChildClass,
                documentsActive ? navChildActiveClass : navChildInactiveClass
              )}
            >
              <MdOutlineTextSnippet className="size-4" />
              {t('librarySidebar.documents')}
            </LocaleLink>
            {canAccessCatalogues ? (
              <LocaleLink
                href="/client/catalogues"
                className={cn(
                  navChildClass,
                  cataloguesActive ? navChildActiveClass : navChildInactiveClass
                )}
              >
                <MdOutlineCategory className="size-4" />
                {t('librarySidebar.catalogues')}
              </LocaleLink>
            ) : (
              <Link
                href="#"
                className={cn(navChildClass, navChildInactiveClass, 'justify-between')}
              >
                <span className="flex items-center gap-2">
                  <MdOutlineCategory className="size-4" />
                  {t('librarySidebar.catalogues')}
                </span>
                <MdLockOutline className="size-3.5 text-muted-foreground" />
              </Link>
            )}
            {/* <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <MdOutlineWidgets className="size-4" />
                {t('librarySidebar.types')}
              </span>
              <MdLockOutline className="size-3.5 text-muted-foreground" />
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <MdOutlineReceiptLong className="size-4" />
                {t('librarySidebar.collections')}
              </span>
              <MdLockOutline className="size-3.5 text-muted-foreground" />
            </Link> */}
          </div>
          )}
        </div>
      </div>

      {/* My personal workspace */}
      <div className="flex shrink-0 flex-col gap-1 p-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {t('librarySidebar.myWorkspace')}
        </p>
        <div className="flex flex-col gap-0.5">
          {/* <button
            type="button"
            onClick={() => toggleSection('myDashboard')}
            className={cn(navParentClass, navParentInactiveClass)}
            aria-expanded={openSections.myDashboard}
          >
            <span className="flex items-center gap-2">
              <MdOutlineDashboard className="size-4" />
              {t('librarySidebar.myDashboard')}
            </span>
            <MdKeyboardArrowDown
              className={cn('size-4 shrink-0 transition-transform', !openSections.myDashboard && '-rotate-90')}
              aria-hidden
            />
          </button>
          {openSections.myDashboard && (
          <div className={childGroupClass}>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass)}>
              <MdOutlineReceipt className="size-4" />
              {t('librarySidebar.recentlyRead')}
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <MdStarBorder className="size-4" />
                {t('librarySidebar.favoriteDocuments')}
              </span>
              <MdLockOutline className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
          )} */}
          <LocaleLink
            href="/client/notes"
            className={cn(navSiblingClass, notesActive && navChildActiveClass)}
          >
            <MdNotes className="size-4" />
            {t('librarySidebar.notes')}
          </LocaleLink>
          <LocaleLink
            href="/client/bookmarks"
            className={cn(navSiblingClass, bookmarksActive && navChildActiveClass)}
          >
            <MdBookmarkBorder className="size-4" />
            {t('librarySidebar.bookmarkedArticles')}
          </LocaleLink>
          {/* <Link href="#" className={cn(navSiblingClass, 'justify-between')}>
            <span className="flex items-center gap-2">
              <MdOutlineFolder className="size-4" />
              {t('librarySidebar.folders')}
            </span>
            <MdLockOutline className="size-3.5 text-muted-foreground" />
          </Link> */}
        </div>
      </div>

      {/* Footer - no top border */}
      <div className="mt-auto shrink-0 p-3">
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <MdHelpOutline className="size-4" />
          {t('client.getHelp')}
        </Link>
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <MdOutlineSettings className="size-4" />
          {t('client.settings')}
        </Link>
      </div>
    </div>
  )
}

export { SIDEBAR_WIDTH }
