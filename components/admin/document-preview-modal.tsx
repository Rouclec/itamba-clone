"use client";

import { useT } from "@/app/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RichTextViewer } from "@/components/client-library/rich-text-viewer";
import { MdOutlineTextSnippet } from "react-icons/md";
import { ChevronDown, ChevronRight, List } from "lucide-react";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import type { NewDocumentFormData } from "@/components/admin/new-document-modal";
import type {
  DocumentDetails,
  DocumentDetailsMaterial,
} from "@/lib/document-details-types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocale } from "@/lib/use-locale";
import { formatDocumentDate } from "@/utils/date";
import { useMemo, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const ARTICLE_ID_PREFIX = "article-";

function sortByPosition(
  materials: DocumentDetailsMaterial[],
): DocumentDetailsMaterial[] {
  return [...materials].sort((a, b) => {
    const pa = a.position ?? Infinity;
    const pb = b.position ?? Infinity;
    return pa - pb;
  });
}

function flattenMaterials(
  materials: DocumentDetailsMaterial[] | undefined,
): {
  id?: string;
  ref: string;
  json_body?: string;
  body?: string;
  isDivision: boolean;
}[] {
  if (!materials?.length) return [];
  const out: {
    id?: string;
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
        id: m.id,
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

function PreviewTocNode({
  entry,
  depth,
  path,
  isOpen,
  onToggle,
  hasChildren,
  scrollToArticle,
  onNavigate,
  isTocPathOpen,
  toggleTocPath,
}: {
  entry: TocEntry;
  depth: number;
  path: string;
  isOpen: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  scrollToArticle: (flatIndex: number) => void;
  onNavigate?: () => void;
  isTocPathOpen: (path: string) => boolean;
  toggleTocPath: (path: string) => void;
}) {
  const { material, flatIndex, children: childEntries } = entry;
  const canExpand = hasChildren;

  const handleNavigate = () => {
    scrollToArticle(flatIndex);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          "flex items-center gap-1 rounded-md py-1.5 pr-2 text-body-text font-medium text-sm hover:bg-hover hover:text-foreground cursor-pointer",
          depth > 0 && "pl-4",
        )}
        style={depth > 0 ? { paddingLeft: `${12 + depth * 14}px` } : undefined}
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
        (childEntries ?? []).map((child, i) => {
          const childPath = `${path}-${i}`;
          return (
            <PreviewTocNode
              key={`${child.material.ref}-${i}`}
              entry={child}
              depth={depth + 1}
              path={childPath}
              isOpen={isTocPathOpen(childPath)}
              onToggle={() => toggleTocPath(childPath)}
              hasChildren={!!child.material.children?.length}
              scrollToArticle={scrollToArticle}
              onNavigate={onNavigate}
              isTocPathOpen={isTocPathOpen}
              toggleTocPath={toggleTocPath}
            />
          );
        })}
    </div>
  );
}

export interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Form data (new document preview) */
  data?: NewDocumentFormData | null;
  /** API document (view from table). When set, takes precedence over data. */
  document?: DocumentDetails | null;
  /** True while fetching document (view mode). Show loading inside modal. */
  documentLoading?: boolean;
  /** Resolve type id to display label (only when using data) */
  getTypeLabel?: (typeId: string) => string;
}

function getDocTypeLabel(
  titles: { en?: string; fr?: string } | undefined,
  locale: string,
): string {
  if (!titles) return "";
  const isFr = locale.startsWith("fr");
  return isFr ? (titles.fr ?? titles.en ?? "") : (titles.en ?? titles.fr ?? "");
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  data = null,
  document: doc = null,
  documentLoading = false,
  getTypeLabel,
}: DocumentPreviewModalProps) {
  const { t } = useT("translation");
  const locale = useLocale();

  const typeLabel = doc
    ? getDocTypeLabel(doc.document_type?.titles, locale)
    : (data?.type && getTypeLabel ? getTypeLabel(data.type) : "");
  const dateStr = doc
    ? formatDocumentDate(doc.issue_date, locale)
    : data?.issuedDate
      ? format(data.issuedDate, "MMM dd, yyyy", {
          locale: locale.startsWith("fr") ? fr : undefined,
        })
      : "";
  const refLine = doc
    ? [doc.ref ?? doc.document_number, dateStr, typeLabel].filter(Boolean).join(" | ")
    : [data?.reference, dateStr, typeLabel].filter(Boolean).join(" | ");
  const title = doc ? (doc.title ?? "") : (data?.title ?? "");

  const headerContent = doc ? doc.json_header : data?.headerJson;
  const footerContent = doc ? doc.json_footer : data?.footerJson;
  const hasHeader =
    headerContent != null &&
    headerContent.trim() !== "" &&
    headerContent.trim() !== "{}";
  const hasFooter =
    footerContent != null &&
    footerContent.trim() !== "" &&
    footerContent.trim() !== "{}";

  const hasChildren = !!(doc?.children?.length);
  const flat = useMemo(
    () => (hasChildren ? flattenMaterials(doc!.children) : []),
    [hasChildren, doc?.children],
  );
  const tocEntries = useMemo(
    () => (hasChildren ? buildTocWithFlatIndices(doc!.children) : []),
    [hasChildren, doc?.children],
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollToArticle = useCallback((flatIndex: number) => {
    const el = document.getElementById(`${ARTICLE_ID_PREFIX}${flatIndex}`);
    const container = contentRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop =
      container.scrollTop + (elRect.top - containerRect.top);
    container.scrollTo({ top: Math.max(0, scrollTop - 8), behavior: "smooth" });
  }, []);
  const [closedTocPaths, setClosedTocPaths] = useState<Set<string>>(
    () => new Set(),
  );
  const [contentsOpen, setContentsOpen] = useState(false);
  const isTocPathOpen = useCallback(
    (path: string) => !closedTocPaths.has(path),
    [closedTocPaths],
  );
  const toggleTocPath = useCallback((path: string) => {
    setClosedTocPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const hasContent = !!doc || !!data;
  const showLoading = open && documentLoading && !doc;
  if (!open) return null;
  if (!hasContent && !showLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[100] flex max-h-[90vh] w-full flex-col overflow-hidden",
          hasChildren
            ? "max-w-[min(90vw,1130px)]"
            : "max-w-[90vw] sm:max-w-3xl",
        )}
        overlayClassName="z-[100]"
        showCloseButton
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("admin.newDocument.previewTitle")}</DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-x-hidden pr-1 -mr-1",
            hasChildren ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
        >
          {showLoading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("common.loading")}
            </p>
          ) : hasChildren ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row md:gap-6">
              {/* Desktop: side TOC - scrolls independently */}
              <aside className="hidden md:flex md:min-h-0 md:shrink-0 md:w-52 md:flex-col md:gap-2 md:overflow-y-auto md:py-1">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {t("admin.newDocument.previewContents")}
                </p>
                <div className="flex flex-col gap-1 text-sm overflow-y-auto min-h-0">
                  {tocEntries.map((entry, index) => {
                    const path = `${index}`;
                    return (
                      <PreviewTocNode
                        key={`${entry.material.ref}-${index}`}
                        entry={entry}
                        depth={0}
                        path={path}
                        isOpen={isTocPathOpen(path)}
                        onToggle={() => toggleTocPath(path)}
                        hasChildren={!!entry.material.children?.length}
                        scrollToArticle={scrollToArticle}
                        isTocPathOpen={isTocPathOpen}
                        toggleTocPath={toggleTocPath}
                      />
                    );
                  })}
                </div>
              </aside>
              {/* Mobile: Contents button opens sheet */}
              <div className="shrink-0 md:hidden">
                <Sheet open={contentsOpen} onOpenChange={setContentsOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md border border-border bg-muted-fill px-3 py-2 text-sm font-medium text-body-text hover:bg-hover"
                    >
                      <List className="size-4" />
                      {t("admin.newDocument.previewContents")}
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="flex flex-col w-[min(85vw,20rem)]"
                  >
                    <SheetHeader>
                      <SheetTitle>
                        {t("admin.newDocument.previewContents")}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4">
                      {tocEntries.map((entry, index) => {
                        const path = `${index}`;
                        return (
                          <PreviewTocNode
                            key={`${entry.material.ref}-${index}`}
                            entry={entry}
                            depth={0}
                            path={path}
                            isOpen={isTocPathOpen(path)}
                            onToggle={() => toggleTocPath(path)}
                            hasChildren={!!entry.material.children?.length}
                            scrollToArticle={scrollToArticle}
                            onNavigate={() => setContentsOpen(false)}
                            isTocPathOpen={isTocPathOpen}
                            toggleTocPath={toggleTocPath}
                          />
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              {/* Main content - scrolls independently; this is the scroll container for scrollToArticle */}
              <div
                ref={contentRef}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4"
              >
                <div className="gap-1 flex flex-col">
                  <div className="flex gap-2 items-center">
                    <MdOutlineTextSnippet className="size-[18px] shrink-0 text-primary" />
                    <h2 className="text-primary text-lg font-semibold">
                      {refLine || t("admin.newDocument.previewNoRef")}
                    </h2>
                  </div>
                  <h1 className="text-primary text-xl font-semibold leading-tight">
                    {title || t("admin.newDocument.previewNoTitle")}
                  </h1>
                </div>
                {hasHeader && (
                  <div className="text-body-text text-lg bg-hover-light p-4 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic">
                    <RichTextViewer content={headerContent!} />
                  </div>
                )}
                {flat.map((item, i) => {
                  const jsonBody = item.json_body?.trim();
                  const body = item.body?.trim();
                  const hasJsonBody = jsonBody && jsonBody !== "{}";
                  const hasBody = body && body !== "{}";
                  return (
                    <div
                      key={`${item.ref}-${i}`}
                      id={`${ARTICLE_ID_PREFIX}${i}`}
                    >
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
                        <>
                          {hasJsonBody ? (
                            <div className="mt-1 text-body-text text-lg font-light font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                              <RichTextViewer content={item.json_body!} />
                            </div>
                          ) : hasBody ? (
                            <div
                              className="mt-1 text-body-text text-lg font-light font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
                              dangerouslySetInnerHTML={{
                                __html: item.body!,
                              }}
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
                {hasFooter && (
                  <div className="border-t border-border pt-4">
                    <div className="text-body-text text-sm font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                      <RichTextViewer content={footerContent!} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              <div className="gap-1 flex flex-col">
                <div className="flex gap-2 items-center">
                  <MdOutlineTextSnippet className="size-[18px] shrink-0 text-primary" />
                  <h2 className="text-primary text-lg font-semibold">
                    {refLine || t("admin.newDocument.previewNoRef")}
                  </h2>
                </div>
                <h1 className="text-primary text-xl font-semibold leading-tight">
                  {title || t("admin.newDocument.previewNoTitle")}
                </h1>
              </div>

              {hasHeader && (
                <div className="text-body-text text-lg bg-hover-light p-4 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic">
                  <RichTextViewer content={headerContent!} />
                </div>
              )}

              {!hasHeader && !hasFooter && (
                <p className="text-muted-foreground text-sm">
                  {t("admin.newDocument.previewEmptyBody")}
                </p>
              )}

              {hasFooter && (
                <div className="border-t border-border pt-4">
                  <div className="text-body-text text-sm font-merriweather [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                    <RichTextViewer content={footerContent!} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
