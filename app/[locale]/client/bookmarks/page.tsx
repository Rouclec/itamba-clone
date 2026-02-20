"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath, useLocale } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { useBookmarksQuery } from "@/contexts/bookmarks-context";
import { annotationServiceListsUsersBookmarksInfiniteOptions } from "@/@hey_api/annotation.swagger/@tanstack/react-query.gen";
import type { v2Bookmark } from "@/@hey_api/annotation.swagger/types.gen";
import { Input } from "@/components/ui/input";
import { RichTextViewer } from "@/components/client-library/rich-text-viewer";
import { formatBookmarkDateTime } from "@/utils/date";
import { normalizeDateString } from "@/utils/date";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/** Group key: "January 2026" for current year, "2025" for previous years. */
function getGroupKey(updatedAt: string | undefined, currentYear: number): string {
  const normalized = normalizeDateString(updatedAt);
  if (!normalized) return "";
  const date = new Date(normalized);
  const year = date.getFullYear();
  if (year === currentYear) {
    const month = date.toLocaleString("default", { month: "long" });
    return `${month} ${year}`;
  }
  return String(year);
}

function groupBookmarksByDate(
  bookmarks: v2Bookmark[],
  currentYear: number,
): { key: string; items: v2Bookmark[] }[] {
  const map = new Map<string, v2Bookmark[]>();
  for (const b of bookmarks) {
    const key = getGroupKey(b.updatedAt, currentYear);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(b);
    map.set(key, list);
  }
  const currentYearKeys: string[] = [];
  const otherYearsKeys: string[] = [];
  for (const key of map.keys()) {
    if (key.includes(" ")) currentYearKeys.push(key);
    else otherYearsKeys.push(key);
  }
  currentYearKeys.sort((a, b) => {
    const listA = map.get(a) ?? [];
    const listB = map.get(b) ?? [];
    const timesA = listA.map((x) => new Date(normalizeDateString(x.updatedAt) || 0).getTime()).filter((t) => !Number.isNaN(t));
    const timesB = listB.map((x) => new Date(normalizeDateString(x.updatedAt) || 0).getTime()).filter((t) => !Number.isNaN(t));
    const minA = timesA.length ? Math.min(...timesA) : 0;
    const minB = timesB.length ? Math.min(...timesB) : 0;
    return minA - minB;
  });
  otherYearsKeys.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  const orderedKeys = [...currentYearKeys, ...otherYearsKeys];
  return orderedKeys.map((key) => ({
    key,
    items: map.get(key) ?? [],
  }));
}

/** Render snippet: ProseMirror JSON or plain text. */
function BookmarkSnippet({ snippet }: { snippet: string | undefined }) {
  if (!snippet?.trim()) return null;
  const trimmed = snippet.trim();
  const isJson =
    trimmed.startsWith("{") &&
    trimmed.includes('"type"');
  if (isJson) {
    return (
      <div className="line-clamp-2 text-body-text text-sm font-light [&_p]:mb-0.5 [&_p]:line-clamp-2">
        <RichTextViewer content={trimmed} />
      </div>
    );
  }
  return (
    <p className="line-clamp-2 text-body-text text-sm font-light">
      {trimmed}
    </p>
  );
}

export default function BookmarksPage() {
  const path = useLocalePath();
  const locale = useLocale();
  const { t } = useT("translation");
  const { userId } = useAuth();
  useBookmarksQuery();

  const [search, setSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const infiniteOptions = useMemo(
    () =>
      annotationServiceListsUsersBookmarksInfiniteOptions({
        path: { userId: userId ?? "" },
        query: { pageSize: String(PAGE_SIZE) },
      }),
    [userId],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    ...infiniteOptions,
    initialPageParam: "1",
    getNextPageParam: (lastPage) => {
      const stats = lastPage?.statistics;
      const current = parseInt(stats?.currentPage ?? "1", 10);
      const pageCount = parseInt(stats?.pageCount ?? "0", 10);
      if (current >= pageCount) return undefined;
      return String(current + 1);
    },
    enabled: !!userId,
  });

  const allBookmarks = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.bookmarks ?? []),
    [data?.pages],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allBookmarks;
    const q = search.trim().toLowerCase();
    return allBookmarks.filter((b) =>
      (b.materialRef ?? "").toLowerCase().includes(q),
    );
  }, [allBookmarks, search]);

  const currentYear = new Date().getFullYear();
  const grouped = useMemo(
    () => groupBookmarksByDate(filtered, currentYear),
    [filtered, currentYear],
  );

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry?.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="flex flex-col gap-6 min-h-0">
      <div>
        <h1 className="text-primary text-xl font-bold">
          {t("client.bookmarksWithCount", {
            count: data?.pages?.[0]?.statistics?.totalItems ?? allBookmarks.length,
          })}
        </h1>
        <p className="text-inactive-text text-base font-medium mt-0.5">
          {t("client.bookmarksSubtitle")}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 sm:justify-between bg-surface p-4 rounded-lg">
        <div className="relative min-w-0 flex-1 bg-white rounded-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("client.searchBookmarkPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-border placeholder:text-inactive-text"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-8">
          {t("common.loading")}
        </p>
      ) : grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8">
          {t("client.noBookmarks")}
        </p>
      ) : (
        <div className="flex flex-col gap-6 pb-8">
          {grouped.map(({ key, items }) => (
            <div key={key} className="flex flex-col gap-2">
              <h2 className="text-body-text text-sm font-semibold uppercase tracking-wider">
                {key}
              </h2>
              <div className="flex flex-col gap-1 border border-border rounded-lg overflow-hidden bg-white">
                {items.map((bookmark) => {
                  const docId = bookmark.documentId;
                  const materialId = bookmark.materialId;
                  const href =
                    docId && materialId
                      ? path(`/client/bookmarks/${docId}?materialId=${encodeURIComponent(materialId)}`)
                      : docId
                        ? path(`/client/bookmarks/${docId}`)
                        : "#";
                  return (
                    <Link
                      key={bookmark.bookmarkId ?? bookmark.materialId ?? Math.random()}
                      href={href}
                      className={cn(
                        "flex flex-col gap-1 p-4 text-left border-b border-border last:border-b-0",
                        "hover:bg-hover transition-colors",
                      )}
                    >
                      <p className="text-primary font-semibold text-base flex items-center gap-1.5">
                        § {bookmark.materialRef ?? t("client.noContent")}
                      </p>
                      <div className="mt-1">
                        <BookmarkSnippet snippet={bookmark.snippet} />
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5">
                        <p className="text-muted-foreground text-xs min-w-0">
                          {bookmark.documentTitle ?? bookmark.documentId ?? ""}
                        </p>
                        <span className="text-muted-foreground text-xs font-medium shrink-0">
                          {formatBookmarkDateTime(bookmark.updatedAt, locale)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
            {isFetchingNextPage && (
              <span className="text-muted-foreground text-xs">
                {t("common.loading")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
