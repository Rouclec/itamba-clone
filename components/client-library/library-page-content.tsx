"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import {
  MdOutlineTextSnippet,
  MdStarBorder,
  MdLanguage,
  MdInsertDriveFile,
} from "react-icons/md";
import { useT } from "@/app/i18n/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  documentsMaterialsServiceListPublishedDocumentsOptions,
  documentsMaterialsServiceListCategoriesOptions,
  documentsMaterialsServiceListPublishedDocumentTypesOptions,
} from "@/@hey_api/documentsmaterials.swagger/@tanstack/react-query.gen";
import type {
  v2PublishedDocument,
  v2Category,
  v2DocumentType,
} from "@/@hey_api/documentsmaterials.swagger/types.gen";
import { useAuth } from "@/lib/auth-context";
import { useRestrictions } from "@/hooks/use-restrictions";
import {
  RestrictionModal,
  getRestrictionCopy,
} from "@/components/restriction-modal";
import moment from "moment";

const PAGE_SIZE = 9;

const DECADES = [
  { label: "1950s", start: 1950, end: 1959 },
  { label: "1960s", start: 1960, end: 1969 },
  { label: "1970s", start: 1970, end: 1979 },
  { label: "1980s", start: 1980, end: 1989 },
  { label: "1990s", start: 1990, end: 1999 },
  { label: "2000s", start: 2000, end: 2009 },
  { label: "2010s", start: 2010, end: 2019 },
  { label: "2020s", start: 2020, end: 2029 },
] as const;

/**
 * Pagination slots: numbers and ellipsis.
 * - Near start (e.g. 11 pages): 1, 2, 3, 4, …, 9, 10, 11
 * - In middle (e.g. page 20 of 50): 1, …, 19, 20, 21, …, 50
 * - Near end: 1, 2, 3, …, last-2, last-1, last
 */
function getPaginationSlots(
  page: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }
  if (page >= totalPages - 2) {
    return [1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

/** Display shape for list/card to avoid optional chaining in templates */
export interface DocumentDisplayItem {
  id: string;
  reference: string;
  title: string;
  type: string;
  articles: number;
  issued: string;
  language: string;
}

function mapDocumentToDisplay(doc: v2PublishedDocument): DocumentDisplayItem {
  const typeLabel =
    doc.documentType?.titles?.en ??
    doc.documentType?.titles?.fr ??
    doc.documentTypeId ??
    "";
  return {
    id: doc.documentId ?? "",
    reference: doc.ref ?? doc.documentNumber ?? "",
    title: doc.title ?? "",
    type: typeLabel,
    articles: parseInt(doc.materialCount ?? "0", 10),
    issued: doc.issueDate ?? "",
    language: doc.language ?? "",
  };
}

function DocumentCard({
  doc,
  t,
}: {
  doc: DocumentDisplayItem;
  t: (k: string) => string;
}) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-lg border p-4 shadow-xs cursor-pointer hover:bg-hover">
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex flex-row items-stretch overflow-hidden gap-2">
          <div className="shrink-0">
            <MdOutlineTextSnippet className="size-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="min-w-0 truncate text-base text-body-text font-bold">
              {doc.reference} | {moment(doc.issued).format("MMM DD, YYYY")}
            </span>
            <p className="line-clamp-3 min-w-0 text-base font-light font-merriweather mt-1 text-body-text">
              {doc.title}
            </p>
            <div className="mt-10 flex flex-1 items-center gap-4 text-xs font-normal text-inactive-text">
              <span className="flex items-center gap-0.5">
                <MdInsertDriveFile className="size-3.5" />
                {doc.articles} {t("client.articles")}
              </span>
              <span className="flex items-center gap-0.5">
                <MdLanguage className="size-3.5" />{" "}
                {doc.language.slice(0, 2).toUpperCase()}
              </span>
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-body-text">
                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-between items-end">
            <button
              type="button"
              className="shrink-0  bg-hover p-1 rounded-sm text-primary hover:text-foreground"
            >
              <MdStarBorder className="size-4" />
            </button>
            <Button
              size="sm"
              className="shrink-0 bg-surface text-foreground hover:bg-hover"
            >
              {t("client.view")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentTableRow({
  doc,
  t,
  index,
}: {
  doc: DocumentDisplayItem;
  t: (k: string) => string;
  index: number;
}) {
  const isOdd = index % 2 === 1;
  return (
    <TableRow
      className={cn(
        "border-0",
        isOdd ? "bg-[#FAFAFA]" : "bg-white",
      )}
    >
      <TableCell className="px-4 py-7">
        <div className="flex items-center gap-2">
          <MdOutlineTextSnippet className="size-4 text-muted-foreground" />
          {doc.reference}
        </div>
      </TableCell>
      <TableCell className="max-w-xs truncate px-4 py-7">{doc.title}</TableCell>
      <TableCell className="px-4 py-7">
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-xs">
          {doc.type}
        </span>
      </TableCell>
      <TableCell className="px-4 py-7">{doc.articles}</TableCell>
      <TableCell className="px-4 py-7">{moment(doc.issued).format("MMM DD, YYYY")}</TableCell>
      <TableCell className="uppercase text-right px-4 py-7">{doc.language}</TableCell>
    </TableRow>
  );
}

export function LibraryPageContent() {
  const { t, i18n } = useT("translation");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showDocumentsRestriction, setShowDocumentsRestriction] =
    useState(false);
  const { currentUser } = useAuth();
  const role = currentUser?.userRole ?? undefined;
  const userId = currentUser?.userId ?? undefined;
  const { documentsLimit } = useRestrictions(role, userId);
  const lang = i18n?.language ?? i18n?.resolvedLanguage ?? "en";
  const sortByTitle = lang.startsWith("fr")
    ? "SORT_BY_TITLE_FR"
    : "SORT_BY_TITLE_EN";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCatalogueId, setSelectedCatalogueId] = useState<string>("all");
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] =
    useState<string>("all");
  const [selectedDecade, setSelectedDecade] = useState<{
    start: number;
    end: number;
  } | null>(null);

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

  const { data: typeResponse } = useQuery({
    ...documentsMaterialsServiceListPublishedDocumentTypesOptions({
      path: { userId: currentUser?.userId ?? "" },
      query: { page: "1", pageSize: "1000" },
    }),
    enabled: !!currentUser?.userId,
  });

  const categories: v2Category[] = catResponse?.categories ?? [];
  const documentTypes: v2DocumentType[] = typeResponse?.documentTypes ?? [];

  const issueDateFrom = selectedDecade
    ? { year: selectedDecade.start, month: 1, day: 1 }
    : undefined;
  const issueDateTo = selectedDecade
    ? { year: selectedDecade.end, month: 12, day: 31 }
    : undefined;

  const queryOptions = useMemo(
    () =>
      documentsMaterialsServiceListPublishedDocumentsOptions({
        path: { userId: currentUser?.userId ?? "" },
        query: {
          catalogueId:
            selectedCatalogueId && selectedCatalogueId !== "all"
              ? selectedCatalogueId
              : undefined,
          documentTypeId:
            selectedDocumentTypeId && selectedDocumentTypeId !== "all"
              ? selectedDocumentTypeId
              : undefined,
          ...(issueDateFrom && {
            "issueDateFrom.day": issueDateFrom.day,
            "issueDateFrom.month": issueDateFrom.month,
            "issueDateFrom.year": issueDateFrom.year,
          }),
          ...(issueDateTo && {
            "issueDateTo.day": issueDateTo.day,
            "issueDateTo.month": issueDateTo.month,
            "issueDateTo.year": issueDateTo.year,
          }),
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          searchKey: search,
          sortBy: sortByTitle,
          sortOrder: "SORT_ORDER_UNSPECIFIED",
        },
      }),
    [
      currentUser?.userId,
      selectedCatalogueId,
      selectedDocumentTypeId,
      issueDateFrom,
      issueDateTo,
      page,
      search,
      sortByTitle,
    ],
  );

  const { data: listData, isLoading } = useQuery({
    ...queryOptions,
    enabled: !!currentUser?.userId,
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
        Math.ceil(totalItems / PAGE_SIZE) ||
          parseInt(listData?.statistics?.pageCount ?? "1", 10),
      ),
    [totalItems, listData?.statistics?.pageCount],
  );

  const maxAccessiblePage = useMemo(() => {
    if (documentsLimit < 0) return totalPages;
    return Math.min(totalPages, Math.max(1, Math.ceil(documentsLimit / PAGE_SIZE)));
  }, [documentsLimit, totalPages]);

  const documentsRestrictionCopy = useMemo(
    () => getRestrictionCopy("documents-limit", t, documentsLimit < 0 ? undefined : documentsLimit),
    [t, documentsLimit],
  );

  const handlePageChange = (targetPage: number) => {
    if (targetPage > maxAccessiblePage) {
      setShowDocumentsRestriction(true);
      return;
    }
    setPage(targetPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {t("client.libraryWithCount", { count: totalItems })}
          </h1>
          <p className="text-body-text font-normal">
            {t("client.librarySubtitle")}
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

      <div className="flex flex-col gap-4 sm:justify-between bg-surface p-4 rounded-lg">
        <div className="relative flex-1 bg-white rounded-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("client.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-border placeholder:text-inactive-text"
          />
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedCatalogueId}
            onValueChange={(value) => {
              setSelectedCatalogueId(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allCategories")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">{t("client.allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.categoryId}
                  value={cat.categoryId ?? ""}
                  disabled={!cat.categoryId}
                >
                  {lang.startsWith("fr")
                    ? (cat.titles?.fr ?? cat.titles?.en ?? "")
                    : (cat.titles?.en ?? cat.titles?.fr ?? "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedDocumentTypeId}
            onValueChange={(value) => {
              setSelectedDocumentTypeId(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allDocumentTypes")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">
                {t("client.allDocumentTypes")}
              </SelectItem>
              {documentTypes.map((type) => (
                <SelectItem
                  key={type.id}
                  value={type.id ?? ""}
                  disabled={!type.id}
                >
                  {lang.startsWith("fr")
                    ? (type.titles?.fr ?? type.titles?.en ?? "")
                    : (type.titles?.en ?? type.titles?.fr ?? "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedDecade ? `${selectedDecade.start}` : "all"}
            onValueChange={(value) => {
              if (value === "all") {
                setSelectedDecade(null);
              } else {
                const decade = DECADES.find((d) => String(d.start) === value);
                if (decade)
                  setSelectedDecade({ start: decade.start, end: decade.end });
              }
              setPage(1);
            }}
          >
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allIssueDates")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">{t("client.allIssueDates")}</SelectItem>
              {DECADES.map((d) => (
                <SelectItem key={d.start} value={String(d.start)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">
          {t("common.loading")}
        </p>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.length === 0 ? (
            <p className="col-span-full text-muted-foreground py-8 text-center">
              {t("client.noDocuments")}
            </p>
          ) : (
            documents.map((doc, index) => (
              <DocumentCard key={doc.id || `doc-${index}`} doc={doc} t={t} />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden">
          <Table className="border-0">
            <TableHeader className="[&_tr]:border-0">
              <TableRow className="border-0 bg-surface">
                <TableHead className="font-bold p-4">
                  {t("client.reference")}
                </TableHead>
                <TableHead className="font-bold p-4">{t("client.title")}</TableHead>
                <TableHead className="font-bold p-4">{t("client.type")}</TableHead>
                <TableHead className="font-bold p-4">
                  {t("client.articles")}
                </TableHead>
                <TableHead className="font-bold p-4">
                  {t("client.issued")}
                </TableHead>
                <TableHead className="font-bold items-center justify-end flex p-4">
                  <MdLanguage className="size-4 text-body-text font-bold" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-0">
              {documents.length === 0 ? (
                <TableRow className="border-0 bg-white">
                  <TableCell
                    colSpan={7}
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
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
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
            {getPaginationSlots(page, totalPages).map((slot, index) =>
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
        open={showDocumentsRestriction}
        onOpenChange={setShowDocumentsRestriction}
        variant="documents-limit"
        limit={documentsLimit < 0 ? undefined : documentsLimit}
        titleLine1={documentsRestrictionCopy.titleLine1}
        titleLine2={documentsRestrictionCopy.titleLine2}
        body={documentsRestrictionCopy.body}
        ctaText={documentsRestrictionCopy.ctaText}
        imageOverlay={documentsRestrictionCopy.imageOverlay}
      />
    </div>
  );
}
