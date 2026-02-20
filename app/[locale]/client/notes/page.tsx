"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search } from "lucide-react";
import { MdNotes } from "react-icons/md";
import { useAuth } from "@/lib/auth-context";
import { useLocalePath, useLocale } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { annotationServiceListsUsersNotesInfiniteOptions } from "@/@hey_api/annotation.swagger/@tanstack/react-query.gen";
import type { v2UserNote } from "@/@hey_api/annotation.swagger/types.gen";
import { Input } from "@/components/ui/input";
import { RichTextViewer } from "@/components/client-library/rich-text-viewer";
import { formatBookmarkDateTime } from "@/utils/date";
import { normalizeDateString } from "@/utils/date";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

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

function groupNotesByDate(
  notes: v2UserNote[],
  currentYear: number,
): { key: string; items: v2UserNote[] }[] {
  const map = new Map<string, v2UserNote[]>();
  for (const n of notes) {
    const key = getGroupKey(n.updatedAt, currentYear);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(n);
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

function NoteBody({ msg, jsonMsg }: { msg?: string; jsonMsg?: string }) {
  const hasJson = jsonMsg?.trim() && jsonMsg?.trim() !== "{}";
  if (hasJson) {
    return (
      <div className="line-clamp-2 text-body-text text-sm font-light [&_p]:mb-0.5 [&_p]:line-clamp-2">
        <RichTextViewer content={jsonMsg!} />
      </div>
    );
  }
  if (msg?.trim()) {
    return (
      <p className="line-clamp-2 text-body-text text-sm font-light">
        {msg.trim()}
      </p>
    );
  }
  return null;
}

export default function NotesPage() {
  const path = useLocalePath();
  const locale = useLocale();
  const { t } = useT("translation");
  const { userId } = useAuth();

  const [search, setSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const infiniteOptions = useMemo(
    () =>
      annotationServiceListsUsersNotesInfiniteOptions({
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

  const allNotes = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.notes ?? []),
    [data?.pages],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allNotes;
    const q = search.trim().toLowerCase();
    return allNotes.filter(
      (n) =>
        (n.materialRef ?? "").toLowerCase().includes(q) ||
        (n.noteTitle ?? "").toLowerCase().includes(q),
    );
  }, [allNotes, search]);

  const currentYear = new Date().getFullYear();
  const grouped = useMemo(
    () => groupNotesByDate(filtered, currentYear),
    [filtered, currentYear],
  );

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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
          {t("client.notesWithCount", {
            count: data?.pages?.[0]?.statistics?.totalItems ?? allNotes.length,
          })}
        </h1>
        <p className="text-inactive-text text-base font-medium mt-0.5">
          {t("client.notesSubtitle")}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 sm:justify-between bg-surface p-4 rounded-lg">
        <div className="relative min-w-0 flex-1 bg-white rounded-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("client.searchNotesPlaceholder")}
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
          {t("client.noNotes")}
        </p>
      ) : (
        <div className="flex flex-col gap-6 pb-8">
          {grouped.map(({ key, items }) => (
            <div key={key} className="flex flex-col gap-2">
              <h2 className="text-body-text text-sm font-semibold uppercase tracking-wider">
                {key}
              </h2>
              <div className="flex flex-col gap-1 border border-border rounded-lg overflow-hidden bg-white">
                {items.map((note) => {
                  const docId = note.documentId;
                  const materialId = note.materialId;
                  const noteId = note.noteId;
                  const href =
                    docId && materialId && noteId
                      ? path(
                          `/client/notes/${docId}?materialId=${encodeURIComponent(materialId)}&noteId=${encodeURIComponent(noteId)}`,
                        )
                      : docId && materialId
                        ? path(`/client/notes/${docId}?materialId=${encodeURIComponent(materialId)}`)
                        : docId
                          ? path(`/client/notes/${docId}`)
                          : "#";
                  const title = note.noteTitle?.trim() || t("client.untitledNote");
                  return (
                    <Link
                      key={note.noteId ?? note.materialId ?? Math.random()}
                      href={href}
                      className={cn(
                        "flex flex-col gap-1 p-4 text-left border-b border-border last:border-b-0",
                        "hover:bg-hover transition-colors",
                      )}
                    >
                      <p className="text-primary font-semibold text-base flex items-center gap-1.5">
                        <MdNotes className="size-4 shrink-0 text-muted-foreground" />
                        {title}
                      </p>
                      <div className="mt-1">
                        <NoteBody msg={note.msg} jsonMsg={note.jsonMsg} />
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5">
                        <p className="text-muted-foreground text-xs min-w-0">
                          § {note.materialRef ?? t("client.noContent")}
                        </p>
                        <span className="text-muted-foreground text-xs font-medium shrink-0">
                          {formatBookmarkDateTime(note.updatedAt, locale)}
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
