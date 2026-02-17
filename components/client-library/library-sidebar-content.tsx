'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  FolderOpen,
  LayoutGrid,
  BookMarked,
  HelpCircle,
  Settings,
  Star,
  Bookmark,
  StickyNote,
  ChevronDown,
  Lock,
} from 'lucide-react'
import { useT } from '@/app/i18n/client'
import { LocaleLink } from '@/components/locale-link'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH = '16rem'

export function LibrarySidebarContent() {
  const { t } = useT('translation')
  const documentsActive = true // Documents is the current page

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
    <div className="flex h-full min-h-0 w-(--library-sidebar-width) flex-col overflow-y-hidden overflow-x-hidden bg-white">
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
            className={cn(
              navParentClass,
              documentsActive ? navParentActiveClass : navParentInactiveClass
            )}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="size-4" />
              {t('librarySidebar.library')}
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          <div className={childGroupClass}>
            <Link
              href="#"
              className={cn(
                navChildClass,
                documentsActive ? navChildActiveClass : navChildInactiveClass
              )}
            >
              <FileText className="size-4" />
              {t('librarySidebar.documents')}
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <FolderOpen className="size-4" />
                {t('librarySidebar.catalogues')}
              </span>
              <Lock className="size-3.5 text-muted-foreground" />
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <BookMarked className="size-4" />
                {t('librarySidebar.types')}
              </span>
              <Lock className="size-3.5 text-muted-foreground" />
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <FolderOpen className="size-4" />
                {t('librarySidebar.collections')}
              </span>
              <Lock className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* My personal workspace */}
      <div className="flex shrink-0 flex-col gap-1 p-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {t('librarySidebar.myWorkspace')}
        </p>
        <div className="flex flex-col gap-0.5">
          <button type="button" className={cn(navParentClass, navParentInactiveClass)}>
            <span className="flex items-center gap-2">
              <LayoutGrid className="size-4" />
              {t('librarySidebar.myDashboard')}
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          <div className={childGroupClass}>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass)}>
              <FileText className="size-4" />
              {t('librarySidebar.recentlyRead')}
            </Link>
            <Link href="#" className={cn(navChildClass, navChildInactiveClass, 'justify-between')}>
              <span className="flex items-center gap-2">
                <Star className="size-4" />
                {t('librarySidebar.favoriteDocuments')}
              </span>
              <Lock className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
          <Link href="#" className={navSiblingClass}>
            <StickyNote className="size-4" />
            {t('librarySidebar.notes')}
          </Link>
          <Link href="#" className={navSiblingClass}>
            <Bookmark className="size-4" />
            {t('librarySidebar.bookmarkedArticles')}
          </Link>
          <Link href="#" className={cn(navSiblingClass, 'justify-between')}>
            <span className="flex items-center gap-2">
              <FolderOpen className="size-4" />
              {t('librarySidebar.folders')}
            </span>
            <Lock className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Footer - no top border */}
      <div className="mt-auto shrink-0 p-3">
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <HelpCircle className="size-4" />
          {t('client.getHelp')}
        </Link>
        <Link href="#" className={cn(navSiblingClass, 'w-full')}>
          <Settings className="size-4" />
          {t('client.settings')}
        </Link>
      </div>
    </div>
  )
}

export { SIDEBAR_WIDTH }
