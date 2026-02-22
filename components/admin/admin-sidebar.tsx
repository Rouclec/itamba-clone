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
  MdPeopleOutline,
  MdOutlineSubscriptions,
  MdOutlineHistory,
  MdKeyboardArrowDown,
  MdHelpOutline,
  MdOutlineSettings,
} from 'react-icons/md'
import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'
import { cn } from '@/lib/utils'
import { useAdminLayout } from './admin-layout'

export const ADMIN_SIDEBAR_WIDTH = '16rem'

type SectionKey = 'library' | 'activities'

export function AdminSidebarContent() {
  const { t } = useT('translation')
  const { isMobile, setSidebarOpen } = useAdminLayout()
  const pathname = usePathname() ?? ''
  const closeSidebarOnNav = () => {
    if (isMobile) setSidebarOpen(false)
  }
  const normalizedPath = pathname.replace(/\/$/, '')
  const libraryActive =
    pathname !== '' &&
    (normalizedPath.endsWith('/admin') ||
      pathname.includes('/admin/documents') ||
      pathname.includes('/admin/types') ||
      pathname.includes('/admin/catalogues'))
  const typesActive = pathname !== '' && pathname.includes('/admin/types')
  const cataloguesActive = pathname !== '' && pathname.includes('/admin/catalogues')
  const usersActive = pathname !== '' && pathname.includes('/admin/users')
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    library: true,
    activities: true,
  })

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const navParentClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium justify-between'
  const navParentInactiveClass = 'text-[#64748B]'
  const navParentActiveClass = 'text-primary'
  const navChildClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-hover'
  const navChildInactiveClass = 'text-[#64748B]'
  const navChildActiveClass = 'bg-surface text-primary'
  const navSiblingClass =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-hover hover:text-foreground'
  const childGroupClass = 'border-l border-border ml-3 pl-3 flex flex-col gap-0.5'

  return (
    <div
      className="flex h-full min-h-0 w-(--admin-sidebar-width) flex-col overflow-y-auto overflow-x-hidden bg-white"
      style={{ '--admin-sidebar-width': ADMIN_SIDEBAR_WIDTH } as React.CSSProperties}
    >
      <div className="flex h-20 shrink-0 items-center border-b border-border p-4">
        <LocaleLink href="/admin" className="flex items-start gap-2" onClick={closeSidebarOnNav}>
          <div className="relative h-11 w-12 shrink-0">
            <Image src="/assets/logo.png" alt="Itamba" fill className="object-contain" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <div className="font-extrabold leading-none text-2xl text-primary">Itamba</div>
            <div className="text-xs text-[#9A33FD] leading-tight">
              {t('signupLayout.legalLibrary')}
            </div>
          </div>
        </LocaleLink>
      </div>

      <div className="flex shrink-0 flex-col gap-1 p-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {t('admin.sidebar.managePlatform')}
        </p>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => toggleSection('library')}
            className={cn(
              navParentClass,
              libraryActive ? navParentActiveClass : navParentInactiveClass
            )}
            aria-expanded={openSections.library}
          >
            <span className="flex items-center gap-2">
              <MdOutlineLocalLibrary className="size-4" />
              {t('admin.sidebar.library')}
            </span>
            <MdKeyboardArrowDown
              className={cn('size-4 shrink-0 transition-transform', !openSections.library && '-rotate-90')}
              aria-hidden
            />
          </button>
          {openSections.library && (
            <div className={childGroupClass}>
              <LocaleLink
                href="/admin"
                className={cn(
                  navChildClass,
                  libraryActive && !typesActive && !cataloguesActive
                    ? navChildActiveClass
                    : navChildInactiveClass
                )}
                onClick={closeSidebarOnNav}
              >
                <MdOutlineTextSnippet className="size-4" />
                {t('admin.sidebar.documents')}
              </LocaleLink>
              <LocaleLink
                href="/admin/catalogues"
                className={cn(
                  navChildClass,
                  cataloguesActive ? navChildActiveClass : navChildInactiveClass
                )}
                onClick={closeSidebarOnNav}
              >
                <MdOutlineCategory className="size-4" />
                {t('admin.sidebar.catalogues')}
              </LocaleLink>
              <LocaleLink
                href="/admin/types"
                className={cn(
                  navChildClass,
                  typesActive ? navChildActiveClass : navChildInactiveClass
                )}
                onClick={closeSidebarOnNav}
              >
                <MdOutlineWidgets className="size-4" />
                {t('admin.sidebar.types')}
              </LocaleLink>
              {/* <Link
                href="#"
                className={cn(navChildClass, navChildInactiveClass)}
                onClick={closeSidebarOnNav}
              >
                <MdOutlineReceiptLong className="size-4" />
                {t('admin.sidebar.collections')}
              </Link> */}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 p-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {t('admin.sidebar.manageActivities')}
        </p>
        <div className="flex flex-col gap-0.5">
          <LocaleLink
            href="/admin/users"
            className={cn(
              navSiblingClass,
              usersActive ? 'bg-surface text-primary' : ''
            )}
            onClick={closeSidebarOnNav}
          >
            <MdPeopleOutline className="size-4" />
            {t('admin.sidebar.adminUsers')}
          </LocaleLink>
          <Link href="#" className={cn(navSiblingClass)} onClick={closeSidebarOnNav}>
            <MdOutlineSubscriptions className="size-4" />
            {t('admin.sidebar.userSubscriptions')}
          </Link>
          {/* <Link href="#" className={cn(navSiblingClass)} onClick={closeSidebarOnNav}>
            <MdOutlineHistory className="size-4" />
            {t('admin.sidebar.adminActivities')}
          </Link> */}
        </div>
      </div>

      <div className="mt-auto shrink-0 p-3">
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <MdHelpOutline className="size-4" />
          {t('admin.sidebar.getHelp')}
        </Link>
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <MdOutlineSettings className="size-4" />
          {t('admin.sidebar.settings')}
        </Link>
      </div>
    </div>
  )
}
