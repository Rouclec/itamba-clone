"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, List } from "lucide-react";
import { MdOutlineCategory, MdInsertDriveFile } from "react-icons/md";
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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { documentsMaterialsServiceListCategoriesOptions } from "@/@hey_api/documentsmaterials.swagger/@tanstack/react-query.gen";
import type { v2Category } from "@/@hey_api/documentsmaterials.swagger/types.gen";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRestrictions } from "@/hooks/use-restrictions";
import { useLocalePath, useLocale } from "@/lib/use-locale";
import {
  RestrictionModal,
  getRestrictionCopy,
} from "@/components/restriction-modal";

const PAGE_SIZE = 9;

/**
 * Pagination slots: numbers and ellipsis.
 */
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
    if (page >= totalPages - 1)
      return [1, "ellipsis", totalPages - 1, totalPages];
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

function CatalogueCard({
  category,
  t,
}: {
  category: v2Category;
  t: (k: string) => string;
}) {
  const path = useLocalePath();
  const locale = useLocale();
  const isFr = locale.startsWith("fr");
  const title =
    (isFr ? category.titles?.fr : category.titles?.en) ??
    (isFr ? category.titles?.en : category.titles?.fr) ??
    "";
  const description =
    (isFr ? category.description?.fr : category.description?.en) ??
    (isFr ? category.description?.en : category.description?.fr) ??
    "";
  const documentCount = category.documentCount ?? 0;
  const categoryId = category.categoryId ?? "";
  const href = path(`/client/catalogues/${categoryId}`);

  return (
    <Link href={href} className="block min-w-0">
      <Card className="flex h-[184px] min-w-0 flex-col overflow-hidden rounded-lg border p-4 shadow-xs cursor-pointer hover:bg-hover">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex min-h-0 flex-1 flex-row items-stretch gap-2 overflow-hidden">
            <div className="shrink-0">
              <MdOutlineCategory className="size-5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <span className="min-w-0 shrink-0 truncate text-base font-bold text-body-text">
                {title}
              </span>
              <p className="mt-1 line-clamp-3 min-w-0 shrink-0 text-base font-light font-merriweather text-body-text">
                {description}
              </p>
              <div className="min-h-0 flex-1" aria-hidden />
              <div className="flex shrink-0 items-center gap-4 text-xs font-normal text-inactive-text">
                <span className="flex items-center gap-0.5">
                  <MdInsertDriveFile className="size-3.5" />
                  {documentCount} {t("client.documents")}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end">
              <span
                className="inline-flex h-6 items-center justify-center rounded-md gap-1.5 px-3 shrink-0 py-0 border border-border text-foreground hover:bg-hover text-sm font-medium cursor-pointer"
                role="presentation"
              >
                {t("client.view")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CatalogueTableRow({
  category,
  t,
  index,
}: {
  category: v2Category;
  t: (k: string) => string;
  index: number;
}) {
  const router = useRouter();
  const path = useLocalePath();
  const locale = useLocale();
  const isFr = locale.startsWith("fr");
  const title =
    (isFr ? category.titles?.fr : category.titles?.en) ??
    (isFr ? category.titles?.en : category.titles?.fr) ??
    "";
  const description =
    (isFr ? category.description?.fr : category.description?.en) ??
    (isFr ? category.description?.en : category.description?.fr) ??
    "";
  const documentCount = category.documentCount ?? 0;
  const categoryId = category.categoryId ?? "";
  const href = path(`/client/catalogues/${categoryId}`);
  const isOdd = index % 2 === 1;

  return (
    <TableRow
      role="button"
      tabIndex={0}
      className={cn(
        "border-0 cursor-pointer",
        isOdd ? "bg-[#FAFAFA]" : "bg-white",
      )}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      <TableCell className="p-4 font-medium text-body-text">{title}</TableCell>
      <TableCell
        className="max-w-[200px] truncate p-4 text-body-text sm:max-w-[300px]"
        title={description || undefined}
      >
        {description}
      </TableCell>
      <TableCell className="p-4 text-right">
        <span className="flex items-center justify-end gap-1 text-inactive-text">
          <MdInsertDriveFile className="size-3.5" />
          {documentCount} {t("client.documents")}
        </span>
      </TableCell>
    </TableRow>
  );
}

export function CataloguesPageContent() {
  const router = useRouter()
  const path = useLocalePath()

  const { t } = useT("translation");
  const { currentUser, user } = useAuth();
  const role = currentUser?.userRole ?? user?.role ?? undefined;
  const userId = currentUser?.userId ?? undefined;
  const { cataloguesLimit } = useRestrictions(role, userId);
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCataloguesRestriction, setShowCataloguesRestriction] =
    useState(false);

  const sortByTitle = locale.startsWith("fr")
    ? "SORT_BY_TITLE_FR"
    : "SORT_BY_TITLE_EN";

  const pageSize =
    cataloguesLimit >= 0 ? Math.min(cataloguesLimit, PAGE_SIZE) : PAGE_SIZE;

  const queryOptions = useMemo(
    () =>
      documentsMaterialsServiceListCategoriesOptions({
        path: { userId: currentUser?.userId ?? "" },
        query: {
          page: page.toString(),
          pageSize: pageSize.toString(),
          searchKey: search,
          sortBy: sortByTitle,
          sortOrder: "ASC",
        },
      }),
    [currentUser?.userId, page, pageSize, search, sortByTitle],
  );

  const { data: listData, isLoading } = useQuery({
    ...queryOptions,
    enabled: !!currentUser?.userId,
  });

  const categories = useMemo(() => {
    const list = listData?.categories ?? [];
    return list;
  }, [listData?.categories]);

  const totalItems = useMemo(
    () => parseInt(listData?.statistics?.totalItems ?? "0", 10),
    [listData?.statistics?.totalItems],
  );

  const totalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(totalItems / pageSize) ||
          parseInt(listData?.statistics?.pageCount ?? "1", 10),
      ),
    [totalItems, pageSize, listData?.statistics?.pageCount],
  );

  const maxAccessiblePage = useMemo(() => {
    if (cataloguesLimit < 0) return totalPages;
    return Math.min(
      totalPages,
      Math.max(1, Math.ceil(cataloguesLimit / pageSize)),
    );
  }, [cataloguesLimit, totalPages, pageSize]);

  const cataloguesRestrictionCopy = useMemo(
    () =>
      getRestrictionCopy(
        "catalogues-limit",
        t,
        cataloguesLimit >= 0 ? cataloguesLimit : undefined,
      ),
    [t, cataloguesLimit],
  );

  const handlePageChange = (targetPage: number) => {
    if (targetPage > maxAccessiblePage) {
      setShowCataloguesRestriction(true);
      return;
    }
    setPage(targetPage);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {t("client.cataloguesWithCount", { count: totalItems })}
            </h1>
            <p className="text-body-text font-normal">
              {t("client.cataloguesSubtitle")}
            </p>
          </div>
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

        <div className="flex min-w-0 flex-col gap-4 sm:justify-between bg-surface p-4 rounded-lg">
          <div className="relative min-w-0 flex-1 bg-white rounded-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("client.cataloguesSearchPlaceholder")}
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
            {categories.length === 0 ? (
              <p className="col-span-full text-muted-foreground py-8 text-center">
                {t("client.noCatalogues")}
              </p>
            ) : (
              categories.map((cat, index) => (
                <CatalogueCard
                  key={cat.categoryId ?? `cat-${index}`}
                  category={cat}
                  t={t}
                />
              ))
            )}
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto rounded-lg">
            <Table className="border-0">
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-0 bg-surface">
                  <TableHead className="font-bold p-4">
                    {t("client.catalogue")}
                  </TableHead>
                  <TableHead className="font-bold p-4">
                    {t("client.description")}
                  </TableHead>
                  <TableHead className="font-bold p-4 text-right">
                    {t("client.documentsColumn")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-0">
                {categories.length === 0 ? (
                  <TableRow className="border-0 bg-white">
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground text-center px-4 py-7"
                    >
                      {t("client.noCatalogues")}
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat, index) => (
                    <CatalogueTableRow
                      key={cat.categoryId ?? `cat-${index}`}
                      category={cat}
                      t={t}
                      index={index}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end **:data-[slot=pagination-link]:font-normal">
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
                    page >= maxAccessiblePage &&
                      "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <RestrictionModal
          open={showCataloguesRestriction}
          onOpenChange={setShowCataloguesRestriction}
          variant="catalogues-limit"
          limit={cataloguesLimit >= 0 ? cataloguesLimit : undefined}
          titleLine1={cataloguesRestrictionCopy.titleLine1}
          titleLine2={cataloguesRestrictionCopy.titleLine2}
          body={cataloguesRestrictionCopy.body}
          ctaText={cataloguesRestrictionCopy.ctaText}
          imageOverlay={cataloguesRestrictionCopy.imageOverlay}
          onUpgrade={() => router.push(path("/subscription"))}
        />
      </div>
    </div>
  );
}
