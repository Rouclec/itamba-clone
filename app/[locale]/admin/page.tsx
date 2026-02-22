"use client";

import { useState, useMemo } from "react";
import { format, isToday, isYesterday, subDays } from "date-fns";
import {
  Eye,
  Pencil,
  Globe,
  FilePlus,
  Plus,
  Search,
  Minus,
  Check,
  ChevronDown,
  List,
} from "lucide-react";
import { MdOutlineTextSnippet } from "react-icons/md";
import { useT } from "@/app/i18n/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { useTransitionMultipleDocuments } from "@/hooks/use-transition-multiple-documents";
import { getFailedItemDisplayMessage } from "@/lib/transition-documents-api";
import { NewDocumentModal } from "@/components/admin/new-document-modal";
import { NewMaterialModal } from "@/components/admin/new-material-modal";
import { DocumentPreviewModal } from "@/components/admin/document-preview-modal";
import { LocaleLink } from "@/components/locale-link";
import { useGetDocumentDetails } from "@/hooks/use-documents";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useGetDocumentsStatistics,
  getCountByStatus,
} from "@/hooks/use-documents-statistics";
import {
  useGetAllDocuments,
  type AdminDocumentRow,
} from "@/hooks/use-get-all-documents";
import {
  DOCUMENT_STATUSES,
  documentStatusToApi,
  type DocumentStatus,
} from "@/lib/document-status";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/**
 * Pagination slots: numbers and ellipsis (same as client library).
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

function formatModified(date: Date): { line1: string; line2: string } {
  const line2 = format(date, "HH:mm a");
  if (isToday(date)) return { line1: "Today", line2 };
  if (isYesterday(date)) return { line1: "Yesterday", line2 };
  if (date >= subDays(new Date(), 7))
    return { line1: format(date, "EEEE"), line2 };
  return { line1: format(date, "MMM d, yyyy"), line2 };
}

function ownerDisplay(
  createdBy: string | null,
  fullName: string | null,
): string {
  if (!createdBy) return "AD";
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      createdBy,
    );
  if (isUuid || !fullName) return "AD";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

export default function AdminPage() {
  const { t } = useT("translation");
  const { userId, currentUser } = useAuth();
  const isMobile = useIsMobile();
  const { data: statistics, isLoading: statsLoading } =
    useGetDocumentsStatistics();
  const [activeTab, setActiveTab] = useState<DocumentStatus>("inProgress");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMaterialsMap, setSelectedMaterialsMap] = useState<
    Map<string, number>
  >(new Map());
  const [targetStatus, setTargetStatus] = useState<DocumentStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    heading: string;
    content: string;
    isError?: boolean;
  }>({ open: false, heading: "", content: "" });
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [viewDocumentId, setViewDocumentId] = useState<string | null>(null);
  const [editDocumentId, setEditDocumentId] = useState<string | null>(null);
  const [addMaterialDocument, setAddMaterialDocument] = useState<{
    id: string;
    ref: string;
  } | null>(null);

  const { data: viewDocument, isLoading: viewDocumentLoading } =
    useGetDocumentDetails(viewDocumentId);
  const { data: editDocument, isLoading: editDocumentLoading } =
    useGetDocumentDetails(editDocumentId);

  const userIdParam = userId ?? currentUser?.userId ?? "itamba_user";
  const searchKey = search.trim() || undefined;

  const { data: documentsData, isLoading: documentsLoading } =
    useGetAllDocuments({
      page,
      count: PAGE_SIZE,
      userId: userIdParam,
      documentStatus: documentStatusToApi(activeTab),
      searchKey,
    });

  const documents = documentsData?.documents ?? [];
  const totalItems = documentsData?.total ?? 0;
  const totalPages =
    documentsData?.pageCount ?? Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedDocs: AdminDocumentRow[] = documents;

  const getCount = (status: DocumentStatus) =>
    getCountByStatus(statistics, status);

  const visibleIds = useMemo(
    () => paginatedDocs.map((d) => d.id),
    [paginatedDocs],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const headerCheckedState: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const selectedDocCount = selectedIds.size;
  const selectedMaterialsTotal = useMemo(
    () => Array.from(selectedMaterialsMap.values()).reduce((s, n) => s + n, 0),
    [selectedMaterialsMap],
  );

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedMaterialsMap((prev) => {
        const next = new Map(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
      setSelectedMaterialsMap((prev) => {
        const next = new Map(prev);
        paginatedDocs.forEach((doc) => next.set(doc.id, doc.materialsCount));
        return next;
      });
    }
  };

  const toggleSelectRow = (doc: AdminDocumentRow) => {
    const { id, materialsCount } = doc;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedMaterialsMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, materialsCount);
      return next;
    });
  };

  const transitionMutation = useTransitionMultipleDocuments();

  const handleConfirmBulkAction = () => {
    if (!targetStatus) return;
    transitionMutation.mutate(
      {
        documents: Array.from(selectedIds),
        user_id: userIdParam,
        state: documentStatusToApi(targetStatus),
      },
      {
        onSuccess: (data) => {
          setConfirmOpen(false);
          const successCount = data?.success?.length ?? 0;
          const failedItems = data?.failed ?? [];
          const failureCount = failedItems.length;
          const statusName = t(`admin.documents.${targetStatus}`);
          setPage(1);
          setSelectedIds(new Set());
          setSelectedMaterialsMap(new Map());
          setTargetStatus(null);

          const failureDetails =
            failureCount > 0
              ? failedItems
                  .map((item) => getFailedItemDisplayMessage(item))
                  .join("\n")
              : "";

          if (successCount > 0 && failureCount > 0) {
            const summary = `${t("admin.documents.transitionSummary")} ${successCount} ${t("admin.documents.transitionSummarySuccess")} ${failureCount} ${t("admin.documents.transitionSummaryFailure")}`;
            setResultModal({
              open: true,
              heading: t("admin.documents.transitionSummaryHeading"),
              content: failureDetails
                ? `${summary}\n\n${failureDetails}`
                : summary,
              isError: true,
            });
          } else if (failureCount >= selectedDocCount || successCount === 0) {
            const main = `${t("admin.documents.transitionFailed", { status: statusName })} ${t("admin.documents.transitionFailedHint")}`;
            setResultModal({
              open: true,
              heading: t("admin.documents.transitionFailedHeading"),
              content: failureDetails ? `${main}\n\n${failureDetails}` : main,
              isError: true,
            });
          } else {
            setResultModal({
              open: true,
              heading: t("admin.documents.transitionSuccessHeading"),
              content: t("admin.documents.transitionSuccess", {
                count: successCount,
              }),
            });
          }
        },
        onError: () => {
          setConfirmOpen(false);
          setResultModal({
            open: true,
            heading: t("admin.documents.transitionErrorHeading"),
            content: t("admin.documents.transitionError"),
            isError: true,
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto">
      <div className="min-h-0 min-w-0 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {t("admin.documents.title")}
            </h1>
            <p className="text-body-text font-normal">
              {t("admin.documents.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as DocumentStatus);
              setPage(1);
            }}
          >
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 border-b border-border rounded-none w-full sm:w-auto">
              {DOCUMENT_STATUSES.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {t(`admin.documents.${status}`)} (
                  {statsLoading ? "—" : getCount(status)})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            className="w-full sm:w-auto shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => {
              setEditDocumentId(null);
              setNewDocumentOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("admin.documents.newDocument")}
          </Button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 bg-surface p-4 rounded-lg">
          <div className="relative min-w-0 flex-1 bg-white rounded-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("admin.documents.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 border-border placeholder:text-inactive-text"
            />
          </div>
        </div>

        {selectedDocCount > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={
                  headerCheckedState === true
                    ? "true"
                    : headerCheckedState === "indeterminate"
                      ? "mixed"
                      : "false"
                }
                onClick={toggleSelectAllVisible}
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  headerCheckedState === true
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background",
                )}
              >
                {headerCheckedState === true ? (
                  <Check className="size-3.5" />
                ) : headerCheckedState === "indeterminate" ? (
                  <Minus className="size-3.5" />
                ) : null}
              </button>
              <span className="text-sm text-muted-foreground">
                {t("admin.documents.selectedCount", {
                  docCount: selectedDocCount,
                  materialCount: selectedMaterialsTotal,
                })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    {t("admin.documents.moveTo")}
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {DOCUMENT_STATUSES.filter(
                    (status) => status !== activeTab,
                  ).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => {
                        setTargetStatus(status);
                        setConfirmOpen(true);
                      }}
                    >
                      {t(`admin.documents.${status}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        <div className="min-w-0 overflow-x-auto rounded-lg">
          <Table className="border-0 min-w-[900px] table-auto">
            <TableHeader className="[&_tr]:border-0">
              <TableRow className="border-0 bg-surface">
                <TableHead className="font-bold p-4 w-10 shrink-0">
                  <span className="sr-only">
                    {t("admin.documents.selectAll")}
                  </span>
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[100px]">
                  {t("admin.documents.reference")}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[140px]">
                  {t("admin.documents.titleCol")}
                </TableHead>
                <TableHead className="font-bold pl-4 pr-8 pt-4 pb-4 max-w-[96px]">
                  {t("admin.documents.type")}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[80px]">
                  {t("admin.documents.materials")}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[80px]">
                  {t("admin.documents.owner")}
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[90px]">
                  {t("admin.documents.modified")}
                </TableHead>
                <TableHead
                  className="font-bold p-4 w-14 shrink-0 whitespace-nowrap text-right"
                  aria-label={t("admin.documents.language")}
                >
                  <span className="inline-flex w-full justify-end">
                    <Globe className="size-4 text-body-text font-bold" />
                  </span>
                </TableHead>
                <TableHead className="font-bold p-4 min-w-[90px] whitespace-nowrap text-right">
                  {t("admin.documents.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-0">
              {documentsLoading ? (
                <TableRow className="border-0 bg-white">
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground text-center px-4 py-7"
                  >
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : paginatedDocs.length === 0 ? (
                <TableRow className="border-0 bg-white">
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground text-center px-4 py-7"
                  >
                    {t("client.noDocuments")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocs.map((doc, index) => {
                  const { line1, line2 } = formatModified(doc.updatedAt);
                  const owner = ownerDisplay(doc.createdBy, doc.ownerName);
                  const isOdd = index % 2 === 1;
                  const isSelected = selectedIds.has(doc.id);
                  return (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        "group border-0",
                        isOdd ? "bg-[#FAFAFA]" : "bg-white",
                      )}
                    >
                      <TableCell className="w-10 shrink-0 px-4 py-7">
                        <div
                          className={cn(
                            "flex items-center justify-center",
                            isSelected
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectRow(doc)}
                            aria-label={t("admin.documents.selectDocument")}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[240px] px-4 py-7">
                        <div
                          className="flex items-center gap-2 min-w-0"
                          title={doc.reference ?? undefined}
                        >
                          <span className="truncate">{doc.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[240px] px-4 py-7">
                        <div
                          className="flex items-center gap-2 min-w-0"
                          title={doc.title ?? undefined}
                        >
                          <MdOutlineTextSnippet className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pl-4 pr-8 py-7 max-w-[96px]">
                        <span
                          className="inline-block max-w-[96px] min-w-0 rounded-md bg-surface px-1.5 py-0.5 text-xs truncate"
                          title={doc.type}
                        >
                          {doc.type}
                        </span>
                      </TableCell>
                      <TableCell className="pl-8 pr-4 py-7">
                        {doc.materialsCount}
                      </TableCell>
                      <TableCell className="px-4 py-7">
                        <span className="inline-flex items-center justify-center size-8 rounded-full bg-surface text-body-text text-xs font-medium">
                          {owner}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-7">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">
                            {line1}
                          </span>
                          <span className="text-xs">{line2}</span>
                        </div>
                      </TableCell>
                      <TableCell className="uppercase text-right px-4 py-7 whitespace-nowrap">
                        {doc.language}
                      </TableCell>
                      <TableCell className="text-right px-4 py-7 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="p-2 rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
                                  aria-label={t("admin.documents.actionView")}
                                  onClick={() => setViewDocumentId(doc.id)}
                                >
                                  <Eye className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("admin.documents.actionView")}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="p-2 rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
                                  aria-label={t(
                                    "admin.documents.actionAddMaterials",
                                  )}
                                  onClick={() =>
                                    setAddMaterialDocument({
                                      id: doc.id,
                                      ref: doc.reference ?? "",
                                    })
                                  }
                                >
                                  <FilePlus className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("admin.documents.actionAddMaterials")}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="p-2 rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
                                  aria-label={t("admin.documents.actionEdit")}
                                  onClick={() => setEditDocumentId(doc.id)}
                                >
                                  <Pencil className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("admin.documents.actionEdit")}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <LocaleLink
                                  href={`/admin/documents/${doc.id}/materials`}
                                  className="inline-flex p-2 rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
                                  aria-label={t(
                                    "admin.documents.actionViewMaterials",
                                  )}
                                >
                                  <List className="size-4" />
                                </LocaleLink>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("admin.documents.actionViewMaterials")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end **:data-[slot=pagination-link]:font-normal">
          <Pagination className="w-full justify-end">
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
                          setPage(slot);
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

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("admin.documents.transitionConfirmHeading")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {targetStatus
                  ? selectedDocCount === 1
                    ? t("admin.documents.transitionConfirmOne", {
                        status: t(`admin.documents.${targetStatus}`),
                      })
                    : t("admin.documents.transitionConfirmMany", {
                        count: selectedDocCount,
                        status: t(`admin.documents.${targetStatus}`),
                      })
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("admin.documents.no")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmBulkAction();
                }}
                disabled={transitionMutation.isPending}
              >
                {transitionMutation.isPending
                  ? t("common.loading")
                  : t("common.continue")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={resultModal.open}
          onOpenChange={(open) => setResultModal((prev) => ({ ...prev, open }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{resultModal.heading}</AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line">
                {resultModal.content}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                className={
                  resultModal.isError
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : undefined
                }
                onClick={() =>
                  setResultModal((prev) => ({ ...prev, open: false }))
                }
              >
                {t("admin.documents.yes")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <NewDocumentModal
          open={newDocumentOpen || !!editDocumentId}
          onOpenChange={(open) => {
            if (!open) {
              setNewDocumentOpen(false);
              setEditDocumentId(null);
            } else {
              setNewDocumentOpen(true);
            }
          }}
          editDocumentId={editDocumentId}
          editDocument={editDocument ?? null}
          editDocumentLoading={editDocumentLoading}
          onSubmit={() => {
            // Optional: e.g. show success toast; create/update is handled inside the modal
          }}
        />

        <NewMaterialModal
          open={!!addMaterialDocument}
          onOpenChange={(open) => !open && setAddMaterialDocument(null)}
          documentId={addMaterialDocument?.id ?? null}
          parentId={addMaterialDocument?.id ?? null}
          parentRef={addMaterialDocument?.ref ?? ""}
        />

        <DocumentPreviewModal
          open={!!viewDocumentId}
          onOpenChange={(open) => !open && setViewDocumentId(null)}
          document={viewDocument ?? null}
          documentLoading={viewDocumentLoading}
        />
      </div>
    </div>
  );
}
