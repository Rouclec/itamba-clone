'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  annotationServiceListsUsersBookmarksOptions,
  annotationServiceListsUsersNotesOptions,
} from '@/@hey_api/annotation.swagger/@tanstack/react-query.gen'
import { isAdminRole } from '@/utils/auth/role'

/** Role keys used for limit lookups (normalized from API v2UserRole). */
const ROLE_TO_LIMIT_KEY: Record<string, string> = {
  user_role_guest: 'guest',
  user_role_student: 'student',
  user_role_professional: 'professional',
  user_role_organization: 'organization',
  user_role_unspecified: 'guest',
}

const LIMIT_MAPPINGS: Record<
  string,
  { catalogues: number; bookmarks: number; notes: number; documents: number }
> = {
  guest: {
    catalogues: 2,
    bookmarks: 5,
    notes: 5,
    documents: 50,
  },
  student: {
    catalogues: 2,
    bookmarks: 2,
    notes: 2,
    documents: 100,
  },
  professional: {
    catalogues: -1,
    bookmarks: -1,
    notes: -1,
    documents: -1,
  },
  organization: {
    catalogues: -1,
    bookmarks: -1,
    notes: -1,
    documents: -1,
  },
}

export function useRestrictions(
  role: string | undefined,
  userId: string | undefined
): {
  notesExceeded: boolean
  bookmarksExceeded: boolean
  cataloguesLimit: number
  documentsLimit: number
  isGuest: boolean
} {
  const normalizedRole = (role ?? 'guest').toLowerCase().replace(/-/g, '_')
  const limitKey = ROLE_TO_LIMIT_KEY[normalizedRole] ?? 'guest'
  const isAdmin = isAdminRole(role)
  const limits = LIMIT_MAPPINGS[limitKey] ?? LIMIT_MAPPINGS.guest
  const isGuest = limitKey === 'guest'

  const { data: bookmarksData } = useQuery({
    ...annotationServiceListsUsersBookmarksOptions({
      path: { userId: userId ?? '' },
      query: { page: '1', pageSize: '1' },
    }),
    enabled: !!userId && !isAdmin,
  })

  const { data: notesData } = useQuery({
    ...annotationServiceListsUsersNotesOptions({
      path: { userId: userId ?? '' },
      query: { page: '1', pageSize: '1' },
    }),
    enabled: !!userId && !isAdmin,
  })

  const notesExceeded = useMemo(() => {
    if (!userId) return false
    if (limits.notes < 0) return false
    const total = notesData?.statistics?.totalItems
      ? parseInt(notesData.statistics.totalItems, 10)
      : undefined
    if (typeof total !== 'number') return false
    return total >= limits.notes
  }, [limits.notes, notesData?.statistics?.totalItems, userId])

  const bookmarksExceeded = useMemo(() => {
    if (!userId) return false
    if (limits.bookmarks < 0) return false
    const total = bookmarksData?.statistics?.totalItems
      ? parseInt(bookmarksData.statistics.totalItems, 10)
      : undefined
    if (typeof total !== 'number') return false
    return total >= limits.bookmarks
  }, [bookmarksData?.statistics?.totalItems, limits.bookmarks, userId])

  if (isAdmin) {
    return {
      notesExceeded: false,
      bookmarksExceeded: false,
      cataloguesLimit: -1,
      documentsLimit: -1,
      isGuest: false,
    }
  }

  return {
    notesExceeded,
    bookmarksExceeded,
    cataloguesLimit: limits.catalogues,
    documentsLimit: limits.documents,
    isGuest,
  }
}
