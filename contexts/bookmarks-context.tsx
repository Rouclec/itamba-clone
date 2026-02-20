"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { v2Bookmark } from "@/@hey_api/annotation.swagger/types.gen";
import {
  annotationServiceListsUsersBookmarksOptions,
  annotationServiceListsUsersBookmarksQueryKey,
  annotationServiceAddBookmarkMutation,
  annotationServiceRemoveBookmarkMutation,
} from "@/@hey_api/annotation.swagger/@tanstack/react-query.gen";
import { useAuth } from "@/lib/auth-context";

export interface BookmarkToggleParams {
  materialId: string;
  materialRef: string;
  bookmarksExceeded: boolean;
  onLimitReached: () => void;
}

interface BookmarksContextValue {
  /** Set of material IDs to show as bookmarked (optimistic + server). */
  displayBookmarkedIds: Set<string>;
  /** Map materialId → bookmarkId for removal. From last synced server list. */
  materialIdToBookmarkId: Map<string, string>;
  /** Material ID for which add/remove is in progress (show loader). */
  bookmarkPendingMaterialId: string | null;
  /** Call when any screen fetches bookmarks; keeps context in sync. */
  syncFromServer: (bookmarks: v2Bookmark[] | undefined) => void;
  /** Toggle bookmark (add/remove). Optimistic update + API; refetch invalidated. */
  toggleBookmark: (params: BookmarkToggleParams) => void;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function buildSet(bookmarks: v2Bookmark[] | undefined): Set<string> {
  const set = new Set<string>();
  if (!bookmarks) return set;
  for (const b of bookmarks) {
    if (b.materialId) set.add(b.materialId);
  }
  return set;
}

function buildMap(bookmarks: v2Bookmark[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!bookmarks) return map;
  for (const b of bookmarks) {
    if (b.materialId && b.bookmarkId) map.set(b.materialId, b.bookmarkId);
  }
  return map;
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [bookmarksList, setBookmarksList] = useState<v2Bookmark[]>([]);
  const [displayBookmarkedIds, setDisplayBookmarkedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bookmarkPendingMaterialId, setBookmarkPendingMaterialId] = useState<
    string | null
  >(null);

  const materialIdToBookmarkId = useMemo(
    () => buildMap(bookmarksList),
    [bookmarksList],
  );

  const listQueryKey = useMemo(
    () =>
      annotationServiceListsUsersBookmarksQueryKey({
        path: { userId: userId ?? "" },
        query: { page: "1" },
      }),
    [userId],
  );

  /** Invalidate all user bookmarks list queries so useRestrictions and any other consumers get fresh count. */
  const invalidateAllBookmarksQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return (
          typeof key === "object" &&
          key !== null &&
          (key as { _id?: string })._id === "annotationServiceListsUsersBookmarks"
        );
      },
    });
  }, [queryClient]);

  const addBookmarkMutation = useMutation({
    ...annotationServiceAddBookmarkMutation(),
    onSuccess: () => {
      invalidateAllBookmarksQueries();
    },
    onSettled: () => setBookmarkPendingMaterialId(null),
  });

  const removeBookmarkMutation = useMutation({
    ...annotationServiceRemoveBookmarkMutation(),
    onSuccess: () => {
      invalidateAllBookmarksQueries();
    },
    onSettled: () => setBookmarkPendingMaterialId(null),
  });

  const syncFromServer = useCallback(
    (bookmarks: v2Bookmark[] | undefined) => {
      const list = bookmarks ?? [];
      setBookmarksList(list);
      setDisplayBookmarkedIds(buildSet(list));
    },
    [],
  );

  const toggleBookmark = useCallback(
    (params: BookmarkToggleParams) => {
      const {
        materialId,
        materialRef,
        bookmarksExceeded,
        onLimitReached,
      } = params;
      if (!userId) return;

      const isBookmarked = displayBookmarkedIds.has(materialId);
      if (isBookmarked) {
        const bookmarkId = materialIdToBookmarkId.get(materialId);
        if (!bookmarkId) return;
        setDisplayBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(materialId);
          return next;
        });
        setBookmarkPendingMaterialId(materialId);
        removeBookmarkMutation.mutate({
          path: { userId, bookmarkId },
        });
      } else {
        if (bookmarksExceeded) {
          onLimitReached();
        } else {
          setDisplayBookmarkedIds((prev) => new Set(prev).add(materialId));
          setBookmarkPendingMaterialId(materialId);
          addBookmarkMutation.mutate({
            body: {
              bookmark: { materialId, materialRef },
            },
            path: { "bookmark.userId": userId },
          });
        }
      }
    },
    [
      userId,
      displayBookmarkedIds,
      materialIdToBookmarkId,
      addBookmarkMutation,
      removeBookmarkMutation,
    ],
  );

  const value = useMemo<BookmarksContextValue>(
    () => ({
      displayBookmarkedIds,
      materialIdToBookmarkId,
      bookmarkPendingMaterialId,
      syncFromServer,
      toggleBookmark,
    }),
    [
      displayBookmarkedIds,
      materialIdToBookmarkId,
      bookmarkPendingMaterialId,
      syncFromServer,
      toggleBookmark,
    ],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx)
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  return ctx;
}

/** Fetches the user's bookmarks list and syncs it to the bookmarks context. Use on any screen that shows bookmarks. */
export function useBookmarksQuery() {
  const { userId } = useAuth();
  const { syncFromServer } = useBookmarks();
  const query = useQuery({
    ...annotationServiceListsUsersBookmarksOptions({
      path: { userId: userId ?? "" },
      query: { page: "1" },
    }),
    enabled: !!userId,
    staleTime: 45 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 90 * 1000,
  });
  useEffect(() => {
    if (query.data?.bookmarks) syncFromServer(query.data.bookmarks);
  }, [query.data?.bookmarks, syncFromServer]);
  return query;
}
