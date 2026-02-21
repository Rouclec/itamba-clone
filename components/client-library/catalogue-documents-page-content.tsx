"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, List, ArrowLeft } from "lucide-react";
import { MdLanguage } from "react-icons/md";
import { useT } from "@/app/i18n/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  documentsMaterialsServiceListCategoriesOptions,
  documentsMaterialsServiceListPublishedDocumentsOptions,
} from "@/@hey_api/documentsmaterials.swagger/@tanstack/react-query.gen";
import type { v2Category } from "@/@hey_api/documentsmaterials.swagger/types.gen";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalePath, useLocale } from "@/lib/use-locale";
import { useRestrictions } from "@/hooks/use-restrictions";
import {
  DocumentCard,
  DocumentTableRow,
  mapDocumentToDisplay,
} from "@/components/client-library/library-page-content";
import {
  RestrictionModal,
  getRestrictionCopy,
} from "@/components/restriction-modal";

const PAGE_SIZE = 9;

function getPaginationSlots(
  page: number,
  totalPages: number,
  maxVisible?: number,
): (number | "ellipsis")[] {
  const limit = maxVisible ?? 7;
  if (totalPages <= limit) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (limit <= 4) {
    if (page <= 2) return [1, 2, "ellipsis", totalPages];
    if (page >= totalPages - 1) return [1, "ellipsis", totalPages - 1, totalPages];
    return [1, "ellipsis", page, "ellipsis", totalPages];
  }
  if (page <= 4) {
    return [1, 2, 3, 4, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }
  if (page >= totalPages - 2) {
    return [1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function getCategoryTitle(category: v2Category | undefined, locale: string): string {
  if (!category?.titles) return "";
  const isFr = locale.startsWith("fr");
  return (
    (isFr ? category.titles.fr : category.titles.en) ??
    (isFr ? category.titles.en : category.titles.fr) ??
    ""
  );
}

export function CatalogueDocumentsPageContent({
  catalogueId,
}: {
  catalogueId: string;
}) {
  const { t } = useT("translation");
  const router = useRouter();
  const path = useLocalePath();
  const locale = useLocale();
  const { currentUser, user } = useAuth();
  const role = currentUser?.userRole ?? user?.role ?? undefined;
  const userId = currentUser?.userId ?? undefined;
  const { documentsLimit } = useRestrictions(role, userId);
  const isMobile = useIsMobile();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showDocumentsRestriction, setShowDocumentsRestriction] = useState(false);

  const sortByTitle = locale.startsWith("fr") ? "SORT_BY_TITLE_FR" : "SORT_BY_TITLE_EN";

  const effectivePageSize =
    documentsLimit < 0 ? PAGE_SIZE : Math.min(documentsLimit, PAGE_SIZE);

  const { data: catResponse } = useQuery({
    ...documentsMaterialsServiceListCategoriesOptions({
      path: { userId: currentUser?.userId ?? "" },
      query: {
        page: "1",
        pageSize: "1000",
        searchKey: "",
        sortOrder: "ASC",
        sortBy: sortByTitle,
      },
    }),
    enabled: !!currentUser?.userId,
  });

  const category = useMemo(
    () => catResponse?.categories?.find((c) => c.categoryId === catalogueId),
    [catResponse?.categories, catalogueId],
  );
  const catalogueTitle = getCategoryTitle(category, locale);

  const queryOptions = useMemo(
    () =>
      documentsMaterialsServiceListPublishedDocumentsOptions({
        path: { userId: currentUser?.userId ?? "" },
        query: {
          catalogueId,
          page: page.toString(),
          pageSize: effectivePageSize.toString(),
          searchKey: search,
          sortBy: sortByTitle,
          sortOrder: "SORT_ORDER_UNSPECIFIED",
        },
      }),
    [
      currentUser?.userId,
      catalogueId,
      page,
      effectivePageSize,
      search,
      sortByTitle,
    ],
  );

  const { data: listData, isLoading } = useQuery({
    ...queryOptions,
    enabled: !!currentUser?.userId && !!catalogueId,
  });

  const documents = useMemo(
    () => (listData?.documents ?? []).map(mapDocumentToDisplay),
    [listData?.documents],
  );

  const totalItems = useMemo(
    () => parseInt(listData?.statistics?.totalItems ?? "0", 10),
    [listData?.statistics?.totalItems],
  );
  const totalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(totalItems / effectivePageSize) ||
          parseInt(listData?.statistics?.pageCount ?? "1", 10),
      ),
    [totalItems, effectivePageSize, listData?.statistics?.pageCount],
  );

  const maxAccessiblePage = useMemo(() => {
    if (documentsLimit < 0) return totalPages;
    return Math.min(
      totalPages,
      Math.max(1, Math.ceil(documentsLimit / effectivePageSize)),
    );
  }, [documentsLimit, totalPages, effectivePageSize]);

  const documentsRestrictionCopy = useMemo(
    () =>
      getRestrictionCopy(
        "documents-limit",
        t,
        documentsLimit < 0 ? undefined : documentsLimit,
      ),
    [t, documentsLimit],
  );

  const handlePageChange = (targetPage: number) => {
    if (targetPage > maxAccessiblePage) {
      setShowDocumentsRestriction(true);
      return;
    }
    setPage(targetPage);
  };

  const documentHrefPrefix = path(`/client/catalogues/${catalogueId}`);

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex shrink-0 gap-4">
          <Link href={path("/client/catalogues")}>
            <div className="bg-muted-fill size-8 items-center justify-center flex rounded-lg hover:bg-hover">
              <ArrowLeft className="size-4 shrink-0 text-body-text" />
            </div>
          </Link>
          <div>
            <Link href={path("/client/catalogues")}>
              <span className="text-primary font-semibold text-xl leading-tight hover:underline">
                {catalogueTitle || t("client.catalogue")}
              </span>
            </Link>
            <p className="text-body-text text-base font-normal leading-tight">
              {t("client.catalogueDocumentsSubtitle", { count: totalItems })}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-primary">
            {t("client.libraryWithCount", { count: totalItems })}
          </h2>
          <button
            type="button"
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-hover",
              view === "grid" ? "bg-white" : "bg-background",
            )}
          >
            {view === "grid" ? (
              <>
                <List className="size-4" />
                {t("client.listView")}
              </>
            ) : (
              <>
                <LayoutGrid className="size-4" />
                {t("client.gridView")}
              </>
            )}
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 bg-surface p-4 rounded-lg">
          <div className="relative min-w-0 flex-1 bg-white rounded-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("client.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 border-border placeholder:text-inactive-text"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">
            {t("common.loading")}
          </p>
        ) : view === "grid" ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.length === 0 ? (
              <p className="col-span-full text-muted-foreground py-8 text-center">
                {t("client.noDocuments")}
              </p>
            ) : (
              documents.map((doc, index) => (
                <DocumentCard
                  key={doc.id || `doc-${index}`}
                  doc={doc}
                  t={t}
                  documentHref={`${documentHrefPrefix}/${doc.id}`}
                />
              ))
            )}
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto rounded-lg">
            <Table className="border-0">
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-0 bg-surface">
                  <TableHead className="font-bold p-4">{t("client.reference")}</TableHead>
                  <TableHead className="font-bold p-4">{t("client.title")}</TableHead>
                  <TableHead className="font-bold p-4">{t("client.type")}</TableHead>
                  <TableHead className="font-bold p-4">{t("client.articles")}</TableHead>
                  <TableHead className="font-bold p-4">{t("client.issued")}</TableHead>
                  <TableHead className="font-bold items-center justify-end flex p-4">
                    <MdLanguage className="size-4 text-body-text font-bold" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-0">
                {documents.length === 0 ? (
                  <TableRow className="border-0 bg-white">
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground text-center px-4 py-7"
                    >
                      {t("client.noDocuments")}
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc, index) => (
                    <DocumentTableRow
                      key={doc.id || `doc-${index}`}
                      doc={doc}
                      t={t}
                      index={index}
                      documentHref={`${documentHrefPrefix}/${doc.id}`}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end [&_[data-slot=pagination-link]]:font-normal">
          <Pagination className="w-full justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {getPaginationSlots(page, totalPages, isMobile ? 4 : 7).map(
                (slot, index) =>
                  slot === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <span className="px-2">…</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={slot}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(slot);
                        }}
                        isActive={page === slot}
                      >
                        {slot}
                      </PaginationLink>
                    </PaginationItem>
                  ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  aria-disabled={page >= maxAccessiblePage}
                  className={cn(
                    page >= maxAccessiblePage && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <RestrictionModal
          open={showDocumentsRestriction}
          onOpenChange={setShowDocumentsRestriction}
          variant="documents-limit"
          limit={documentsLimit < 0 ? undefined : documentsLimit}
          titleLine1={documentsRestrictionCopy.titleLine1}
          titleLine2={documentsRestrictionCopy.titleLine2}
          body={documentsRestrictionCopy.body}
          ctaText={documentsRestrictionCopy.ctaText}
          imageOverlay={documentsRestrictionCopy.imageOverlay}
          onUpgrade={() => router.push(path("/subscription"))}
        />
      </div>
    </div>
  );
}
