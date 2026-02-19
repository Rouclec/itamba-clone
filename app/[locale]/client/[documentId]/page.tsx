"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowLeft, List } from "lucide-react";
import { useGetDocumentDetails } from "@/hooks/use-documents";
import type {
  DocumentDetails,
  DocumentDetailsMaterial,
} from "@/lib/document-details-types";
import { useLocalePath, useLocale } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { formatDocumentDate } from "@/utils/date";
import { cn } from "@/lib/utils";
import { getAxiosErrorMessage } from "@/utils/axios-error";
import { RichTextViewer } from "@/components/client-library/rich-text-viewer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import {
  MdBookmarkBorder,
  MdCloseFullscreen,
  MdOutlineTextSnippet,
} from "react-icons/md";

const ARTICLE_ID_PREFIX = "article-";

/** Sort materials by position (undefined position last). */
function sortByPosition(
  materials: DocumentDetailsMaterial[],
): DocumentDetailsMaterial[] {
  return [...materials].sort((a, b) => {
    const pa = a.position ?? Infinity;
    const pb = b.position ?? Infinity;
    return pa - pb;
  });
}

/** Flatten materials in document order (by position): ref + json_body/body + isDivision. */
function flattenMaterials(
  materials: DocumentDetailsMaterial[] | undefined,
): { ref: string; json_body?: string; body?: string; isDivision: boolean }[] {
  if (!materials?.length) return [];
  const out: {
    ref: string;
    json_body?: string;
    body?: string;
    isDivision: boolean;
  }[] = [];
  function walk(items: DocumentDetailsMaterial[]) {
    const sorted = sortByPosition(items);
    for (const m of sorted) {
      const body = m.body ?? m.raw_text ?? "";
      out.push({
        ref: m.ref,
        json_body: m.json_body,
        body: body || undefined,
        isDivision: !!(m.children?.length),
      });
      if (m.children?.length) walk(sortByPosition(m.children));
    }
  }
  walk(materials);
  return out;
}

/** TOC entry with flat index so we can scroll to the same order as right-side content. */
interface TocEntry {
  material: DocumentDetailsMaterial;
  flatIndex: number;
  children?: TocEntry[];
}

function buildTocWithFlatIndices(
  materials: DocumentDetailsMaterial[] | undefined,
): TocEntry[] {
  if (!materials?.length) return [];
  let index = 0;
  function walk(items: DocumentDetailsMaterial[]): TocEntry[] {
    const sorted = sortByPosition(items);
    return sorted.map((m) => {
      const flatIndex = index++;
      const children = m.children?.length
        ? walk(sortByPosition(m.children))
        : undefined;
      return { material: m, flatIndex, children };
    });
  }
  return walk(materials);
}

/** Scroll the article container so the target element is in view (avoids scrolling layout / horizontal shift). */
function useScrollToArticle(articleRef: React.RefObject<HTMLElement | null>) {
  return useCallback((flatIndex: number) => {
    const el = document.getElementById(`${ARTICLE_ID_PREFIX}${flatIndex}`);
    const container = articleRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop = container.scrollTop + (elRect.top - containerRect.top);
    container.scrollTo({ top: Math.max(0, scrollTop - 8), behavior: "smooth" });
  }, [articleRef]);
}

function DocumentToc({
  doc,
  openIndices,
  onToggle,
  onNavigate,
  scrollToArticle,
}: {
  doc: DocumentDetails;
  openIndices: Set<number>;
  onToggle: (index: number) => void;
  /** Called when a TOC item is chosen (e.g. to close mobile sheet). */
  onNavigate?: () => void;
  scrollToArticle: (flatIndex: number) => void;
}) {
  const tocEntries = useMemo(
    () => buildTocWithFlatIndices(doc.children),
    [doc.children],
  );

  return (
    <div className="flex flex-col gap-1 text-sm">
      {tocEntries.map((entry, index) => (
        <TocNode
          key={`${entry.material.ref}-${index}`}
          entry={entry}
          depth={0}
          isTopParent
          isOpen={openIndices.has(index)}
          onToggle={() => onToggle(index)}
          hasChildren={!!entry.material.children?.length}
          onNavigate={onNavigate}
          scrollToArticle={scrollToArticle}
        />
      ))}
    </div>
  );
}

function TocNode({
  entry,
  depth,
  isTopParent,
  isOpen,
  onToggle,
  hasChildren,
  onNavigate,
  scrollToArticle,
}: {
  entry: TocEntry;
  depth: number;
  isTopParent: boolean;
  isOpen: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  onNavigate?: () => void;
  scrollToArticle: (flatIndex: number) => void;
}) {
  const { material, flatIndex, children: childEntries } = entry;
  const canExpand = isTopParent && hasChildren;

  const handleNavigate = () => {
    scrollToArticle(flatIndex);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          "flex items-center gap-1 rounded-md py-1.5 pr-2 text-body-text font-medium text-base hover:bg-hover hover:text-foreground cursor-pointer",
          depth > 0 && "pl-4",
        )}
        style={depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : undefined}
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNavigate();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {canExpand ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="shrink-0 p-0.5 -m-0.5"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {canExpand ? (
          <>
            <HiOutlineMenuAlt4 className="size-4 shrink-0 text-body-text" />
            <span className="min-w-0 truncate">{material.ref}</span>
          </>
        ) : (
          <span className="min-w-0 truncate">§ {material.ref}</span>
        )}
      </div>
        {canExpand &&
        isOpen &&
        (childEntries ?? []).map((child, i) => (
          <TocNode
            key={`${child.material.ref}-${i}`}
            entry={child}
            depth={depth + 1}
            isTopParent={false}
            isOpen={true}
            onToggle={() => {}}
            hasChildren={!!child.material.children?.length}
            onNavigate={onNavigate}
            scrollToArticle={scrollToArticle}
          />
        ))}
    </div>
  );
}

function getDocTypeLabelForLocale(
  titles: { en?: string; fr?: string } | undefined,
  locale: string,
): string {
  if (!titles) return "";
  const isFr = locale.startsWith("fr");
  return isFr ? (titles.fr ?? titles.en ?? "") : (titles.en ?? titles.fr ?? "");
}

function DocumentContent({ doc }: { doc: DocumentDetails }) {
  const locale = useLocale();
  const flat = useMemo(() => flattenMaterials(doc.children), [doc.children]);
  const docTypeLabel = getDocTypeLabelForLocale(
    doc.document_type?.titles,
    locale,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="gap-1 flex flex-col">
        <div className="flex gap-2 items-center">
          <MdOutlineTextSnippet className="size-[18px] text-primary" />
          <h2 className="text-primary text-lg font-semibold">
            {doc.ref} | {formatDocumentDate(doc.issue_date, locale)} |{" "}
            {docTypeLabel}
          </h2>
        </div>
        <h1 className="text-primary text-xl font-semibold leading-tight">
          {doc.title}
        </h1>
      </div>
      {doc.json_header != null && doc.json_header.trim() !== "" ? (
        <div className="text-body-text text-lg bg-hover-light p-4 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic">
          <RichTextViewer content={doc.json_header} />
        </div>
      ) : doc.header != null && doc.header.trim() !== "" ? (
        <div
          className="text-body-text text-lg bg-hover-light [&_p]:mb-2 p-4 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
          dangerouslySetInnerHTML={{ __html: doc.header }}
        />
      ) : null}
      {flat.map((item, i) => {
        const jsonBody = item.json_body?.trim();
        const body = item.body?.trim();
        const hasJsonBody = jsonBody && jsonBody !== "{}";
        const hasBody = body && body !== "{}";
        return (
          <div key={`${item.ref}-${i}`} id={`${ARTICLE_ID_PREFIX}${i}`}>
            <div className="flex items-center justify-between">
              <p className="text-body-text font-bold flex items-center gap-1.5">
                {item.isDivision ? (
                  <>
                    <HiOutlineMenuAlt4 className="size-4 shrink-0" />
                    {item.ref}
                  </>
                ) : (
                  <>§ {item.ref}</>
                )}
              </p>
              {!item.isDivision && (
                <div className="flex items-center gap-4">
                  <div className="cursor-pointer size-8 rounded-md items-center justify-center flex bg-hover hover:bg-hover-light">
                    <MdBookmarkBorder className="size-4 text-body-text" />
                  </div>
                  <div className="cursor-pointer size-8 rounded-md items-center justify-center flex bg-hover hover:bg-hover-light">
                    <MdCloseFullscreen className="size-4 text-body-text" />
                  </div>
                </div>
              )}
            </div>
            {hasJsonBody ? (
              <div className="mt-1 text-body-text text-lg font-light font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                <RichTextViewer content={item.json_body!} />
              </div>
            ) : hasBody ? (
              <div
                className="mt-1 text-body-text text-lg font-light font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
                dangerouslySetInnerHTML={{ __html: item.body! }}
              />
            ) : null}
          </div>
        );
      })}
      {(doc.json_footer != null && doc.json_footer.trim() !== "") ||
      (doc.footer != null && doc.footer.trim() !== "") ? (
        <div className="border-t border-border pt-4">
          {doc.json_footer != null && doc.json_footer.trim() !== "" ? (
            <div className="text-body-text text-sm font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
              <RichTextViewer content={doc.json_footer} />
            </div>
          ) : (
            <div
              className="text-body-text text-sm font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
              dangerouslySetInnerHTML={{ __html: doc.footer ?? "" }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function DocumentDetailsPage() {
  const params = useParams();
  const documentId = params?.documentId as string | undefined;
  const path = useLocalePath();
  const { t } = useT("translation");
  const {
    data: doc,
    isLoading,
    error,
  } = useGetDocumentDetails(documentId ?? null);

  const [closedTocIndices, setClosedTocIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [contentsOpen, setContentsOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const scrollToArticle = useScrollToArticle(articleRef);
  const topLevelCount = doc?.children?.length ?? 0;
  const openIndices = useMemo(() => {
    const closed = closedTocIndices;
    const open = new Set<number>();
    for (let i = 0; i < topLevelCount; i++) {
      if (!closed.has(i)) open.add(i);
    }
    return open;
  }, [closedTocIndices, topLevelCount]);

  const toggleToc = (index: number) => {
    setClosedTocIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!documentId) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (error || !doc) {
    const backendMessage = error
      ? getAxiosErrorMessage(error)
      : t("client.noDocuments");
    return (
      <div className="flex flex-col gap-2 py-8 text-center">
        <h2 className="text-body-text text-lg font-semibold">
          {t("client.errorFetchingDocumentDetails")}
        </h2>
        <p className="text-muted-foreground text-sm">{backendMessage}</p>
      </div>
    );
  }

  const locale = useLocale();
  const docTypeLabel = getDocTypeLabelForLocale(
    doc.document_type?.titles,
    locale,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      {/* Breadcrumb: back + ref, then date | type */}
      <div className="flex shrink-0 gap-4">
        <Link href={path("/client")}>
          <div className="bg-muted-fill size-8 items-center justify-center flex rounded-lg hover:bg-hover">
            <ArrowLeft className="size-4 shrink-0 texg-body-text" />
          </div>
        </Link>
        <div>
          <Link href={path("/client")}>
            <span className="text-primary font-semibold text-xl leading-tight">
              {doc.ref || doc.document_number || doc.title}
            </span>
          </Link>
          <p className="text-body-text text-base font-normal leading-tight">
            {formatDocumentDate(doc.issue_date, locale)}
            {docTypeLabel && ` | ${docTypeLabel}`}
          </p>
        </div>
      </div>

      {/* Two-column row: pull left only so TOC is flush, no horizontal overflow */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden md:-ml-4 md:flex-row">
        {/* Desktop: left TOC, flush left, scrolls only when content overflows */}
        <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:gap-2 md:overflow-y-auto md:min-h-0 md:py-0">
          <DocumentToc
            doc={doc}
            openIndices={openIndices}
            onToggle={toggleToc}
            scrollToArticle={scrollToArticle}
          />
        </aside>
        {/* Mobile: sticky Contents button opens sheet for quick access */}
        <div className="md:hidden sticky top-0 z-10 bg-background pb-2 -mt-1 pt-1 shrink-0">
          <Sheet open={contentsOpen} onOpenChange={setContentsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-border bg-muted-fill px-3 py-2 text-sm font-medium text-body-text hover:bg-hover"
              >
                <List className="size-4" />
                Contents
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[min(85vw,20rem)]">
              <SheetHeader>
                <SheetTitle>Contents</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4">
                <DocumentToc
                  doc={doc}
                  openIndices={openIndices}
                  onToggle={toggleToc}
                  onNavigate={() => setContentsOpen(false)}
                  scrollToArticle={scrollToArticle}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <article
          ref={articleRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto md:pl-5"
        >
          <DocumentContent doc={doc} />
        </article>
      </div>
    </div>
  );
}
