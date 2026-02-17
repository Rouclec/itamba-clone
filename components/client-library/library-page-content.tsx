"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List, FileText, Star, Globe } from "lucide-react";
import { useT } from "@/app/i18n/client";
import {
  getMockDocuments,
  MOCK_TOTAL_DOCUMENTS,
  type DocumentItem,
} from "@/lib/mock-documents";
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

const PAGE_SIZE = 9;

function DocumentCard({
  doc,
  t,
}: {
  doc: DocumentItem;
  t: (k: string) => string;
}) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-lg border p-4 shadow-xs cursor-pointer hover:bg-hover">
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex flex-row items-stretch overflow-hidden gap-2">
          <div className="shrink-0">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="min-w-0 truncate text-base text-body-text font-bold">
              {doc.reference} | {doc.issued}
            </span>
            <p className="line-clamp-3 min-w-0 text-base font-light text-body-text">
              {doc.title}
            </p>
            <div className="mt-10 flex flex-1 items-center gap-4 text-xs font-normal text-inactive-text">
              <span>
                {doc.articles} {t("client.articles")}
              </span>
              <span className="flex items-center gap-0.5">
                <Globe size={12} /> {doc.language.slice(0, 2).toUpperCase()}
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
              <Star className="size-4" />
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
}: {
  doc: DocumentItem;
  t: (k: string) => string;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          {doc.reference}
        </div>
      </TableCell>
      <TableCell className="max-w-xs truncate">{doc.title}</TableCell>
      <TableCell>
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-xs">
          {doc.type}
        </span>
      </TableCell>
      <TableCell>{doc.articles}</TableCell>
      <TableCell>{doc.issued}</TableCell>
      <TableCell className="uppercase">{doc.language}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          className="bg-surface text-foreground hover:bg-hover"
        >
          {t("client.view")}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function LibraryPageContent() {
  const { t } = useT("translation");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const documents = useMemo(() => getMockDocuments(page, PAGE_SIZE), [page]);

  const totalPages = Math.ceil(MOCK_TOTAL_DOCUMENTS / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {t("client.libraryWithCount", { count: MOCK_TOTAL_DOCUMENTS })}
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
          <Select defaultValue="all">
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allCategories")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">{t("client.allCategories")}</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allDocumentTypes")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">
                {t("client.allDocumentTypes")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={t("client.allIssueDates")} />
            </SelectTrigger>
            <SelectContent whiteBackground>
              <SelectItem value="all">{t("client.allIssueDates")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} t={t} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("client.reference")}</TableHead>
                <TableHead>{t("client.title")}</TableHead>
                <TableHead>{t("client.type")}</TableHead>
                <TableHead>{t("client.articles")}</TableHead>
                <TableHead>{t("client.issued")}</TableHead>
                <TableHead className="w-16">{t("client.language")}</TableHead>
                <TableHead className="text-right w-[90px]">
                  {t("client.view")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <DocumentTableRow key={doc.id} doc={doc} t={t} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage((p) => p - 1);
                }}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p);
                    }}
                    isActive={page === p}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {totalPages > 5 && (
              <PaginationItem>
                <span className="px-2">…</span>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage((p) => p + 1);
                }}
                aria-disabled={page >= totalPages}
                className={cn(
                  page >= totalPages && "pointer-events-none opacity-50",
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
