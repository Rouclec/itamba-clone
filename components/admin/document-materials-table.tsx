"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
import { format, isToday, isYesterday, subDays } from "date-fns";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { useT } from "@/app/i18n/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  type AdminMaterialRow,
  getRowById as getRowByIdInTree,
} from "@/hooks/use-document-materials";
import type { MaterialStatus } from "@/lib/material-status";

function formatModified(date: Date): { line1: string; line2: string } {
  const line2 = format(date, "HH:mm a");
  if (date.getTime() === 0) return { line1: "—", line2: "—" };
  if (isToday(date)) return { line1: "Today", line2 };
  if (isYesterday(date)) return { line1: "Yesterday", line2 };
  if (date >= subDays(new Date(), 7))
    return { line1: format(date, "EEEE"), line2 };
  return { line1: format(date, "MMM d, yyyy"), line2 };
}

/** Flatten tree to visible rows (respect expanded state). When fullTree is passed, expanded rows show their real children from fullTree (so children in another tab are still visible). */
function getVisibleRows(
  rows: AdminMaterialRow[],
  expandedIds: Set<string>,
  fullTree: AdminMaterialRow[] | null,
): { row: AdminMaterialRow; depth: number }[] {
  const out: { row: AdminMaterialRow; depth: number }[] = [];
  function walk(list: AdminMaterialRow[], depth: number) {
    for (const row of list) {
      out.push({ row, depth });
      if (expandedIds.has(row.id)) {
        const children =
          fullTree != null
            ? getRowByIdInTree(fullTree, row.id)?.children ?? row.children
            : row.children;
        if (children.length > 0) {
          walk(children, depth + 1);
        }
      }
    }
  }
  walk(rows, 0);
  return out;
}

export interface DocumentMaterialsTableProps {
  /** Filtered tree for current tab (status). */
  materials: AdminMaterialRow[];
  /** Full tree (all statuses) so expanded rows can show children that are in the other tab. */
  fullTree?: AdminMaterialRow[] | null;
  documentId: string;
  documentRef: string;
  activeTab: MaterialStatus;
  selectedIds: Set<string>;
  onToggleSelect: (row: AdminMaterialRow) => void;
  onView: (row: AdminMaterialRow) => void;
  onEdit: (row: AdminMaterialRow) => void;
  onDelete: (row: AdminMaterialRow) => void;
  onAddChild: (row: AdminMaterialRow) => void;
  onReorder?: (fromId: string, toId: string, after: boolean) => void;
}

export function DocumentMaterialsTable({
  materials,
  fullTree = null,
  documentId,
  documentRef,
  activeTab,
  selectedIds,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onAddChild,
  onReorder,
}: DocumentMaterialsTableProps) {
  const { t } = useT("translation");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropAbove, setDropAbove] = useState<boolean>(false);

  const visible = useMemo(
    () => getVisibleRows(materials, expandedIds, fullTree),
    [materials, expandedIds, fullTree],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, row: AdminMaterialRow) => {
    setDraggedId(row.id);
    setDraggedParentId(row.parentId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", row.id);
  }, []);
  const handleDragOver = useCallback(
    (e: React.DragEvent, targetRow: AdminMaterialRow) => {
      e.preventDefault();
      const isSibling =
        draggedParentId != null && targetRow.parentId === draggedParentId;
      const isValid =
        draggedId &&
        draggedId !== targetRow.id &&
        isSibling;
      e.dataTransfer.dropEffect = isValid ? "move" : "none";
      if (isValid) {
        const rowEl = e.currentTarget as HTMLElement;
        const rect = rowEl.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        setDropAbove(e.clientY < mid);
        setDropTargetId(targetRow.id);
      } else {
        setDropTargetId(null);
      }
    },
    [draggedId, draggedParentId],
  );
  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent, targetRow: AdminMaterialRow) => {
      e.preventDefault();
      const fromId = e.dataTransfer.getData("text/plain");
      const isSibling =
        draggedParentId != null && targetRow.parentId === draggedParentId;
      if (
        fromId &&
        targetRow.id &&
        fromId !== targetRow.id &&
        isSibling &&
        onReorder
      ) {
        onReorder(fromId, targetRow.id, !dropAbove);
      }
      setDropTargetId(null);
      setDraggedId(null);
      setDraggedParentId(null);
    },
    [onReorder, draggedParentId, dropAbove],
  );
  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDraggedParentId(null);
    setDropTargetId(null);
  }, []);

  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white px-4 py-12 text-center text-muted-foreground">
        {t("admin.materials.noMaterials")}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg">
      <Table className="min-w-[700px] table-auto border-0">
        <TableHeader>
          <TableRow className="border-0 bg-surface">
            <TableHead className="w-10 shrink-0 p-4 font-bold">
              <span className="sr-only">{t("admin.documents.selectAll")}</span>
            </TableHead>
            <TableHead className="w-8 shrink-0 p-4 font-bold" aria-hidden />
            <TableHead className="min-w-[90px] p-4 font-bold">
              {t("admin.materials.materialNumber")}
            </TableHead>
            <TableHead className="min-w-[120px] p-4 font-bold">
              {t("admin.materials.reference")}
            </TableHead>
            <TableHead className="min-w-[70px] p-4 font-bold">
              {t("admin.materials.children")}
            </TableHead>
            <TableHead className="min-w-[90px] p-4 font-bold">
              {t("admin.materials.created")}
            </TableHead>
            <TableHead className="min-w-[90px] p-4 font-bold">
              {t("admin.materials.updated")}
            </TableHead>
            <TableHead className="min-w-[90px] shrink-0 p-4 text-right font-bold">
              {t("admin.materials.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-0">
          {visible.map(({ row, depth }, index) => {
            const { line1, line2 } = formatModified(row.updatedAt);
            const isSelected = selectedIds.has(row.id);
            const hasChildren = row.childrenCount > 0;
            const isExpanded = expandedIds.has(row.id);
            const isDivision = row.material_type === "division";
            const isDropTarget = dropTargetId === row.id;
            const showLineAbove = isDropTarget && dropAbove;
            const showLineBelow = isDropTarget && !dropAbove;

            const dropLineRow = (
              <TableRow key={`drop-line-${row.id}`} className="border-0 hover:bg-transparent">
                <TableCell colSpan={8} className="p-0 h-0 border-0 align-middle">
                  <div className="h-0.5 min-h-[2px] w-full bg-primary rounded-full" aria-hidden />
                </TableCell>
              </TableRow>
            );

            return (
              <Fragment key={row.id}>
                {showLineAbove && dropLineRow}
                <TableRow
                  draggable={!!onReorder}
                  onDragStart={
                    onReorder ? (e) => handleDragStart(e, row) : undefined
                  }
                  onDragOver={
                    onReorder ? (e) => handleDragOver(e, row) : undefined
                  }
                  onDragLeave={onReorder ? handleDragLeave : undefined}
                  onDrop={onReorder ? (e) => handleDrop(e, row) : undefined}
                  onDragEnd={onReorder ? handleDragEnd : undefined}
                  className={cn(
                    "group border-0 relative",
                    index % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white",
                    draggedId === row.id && "opacity-50",
                  )}
                >
                <TableCell className="w-10 shrink-0 px-4 py-5">
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
                      onCheckedChange={() => onToggleSelect(row)}
                      aria-label={t("admin.materials.selectMaterial")}
                    />
                  </div>
                </TableCell>
                <TableCell className="w-8 shrink-0 px-2 py-5">
                  <div className="flex items-center gap-1">
                    {onReorder && (
                      <span
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                        title="Drag to reorder"
                      >
                        <GripVertical className="size-4" />
                      </span>
                    )}
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(row.id)}
                        className="p-0.5 rounded hover:bg-hover text-muted-foreground hover:text-foreground"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className="px-4 py-5"
                  style={{ paddingLeft: `${12 + depth * 20}px` }}
                >
                  <span className="text-sm">{row.material_number}</span>
                </TableCell>
                <TableCell className="max-w-[200px] px-4 py-5">
                  <span className="truncate block" title={row.ref}>
                    {row.ref}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-5">{row.childrenCount}</TableCell>
                <TableCell className="px-4 py-5">
                  <div className="flex flex-col text-xs">
                    <span className="text-muted-foreground">{line1}</span>
                    <span>{line2}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-5">
                  <div className="flex flex-col text-xs">
                    <span className="text-muted-foreground">{line1}</span>
                    <span>{line2}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-4 py-5">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                            aria-label={t("admin.materials.actionView")}
                            onClick={() => onView(row)}
                          >
                            <Eye className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.materials.actionView")}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                            aria-label={t("admin.materials.actionEdit")}
                            onClick={() => onEdit(row)}
                          >
                            <Pencil className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.materials.actionEdit")}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-destructive"
                            aria-label={t("admin.materials.actionDelete")}
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("admin.materials.actionDelete")}
                        </TooltipContent>
                      </Tooltip>
                      {isDivision && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                              aria-label={t("admin.materials.actionAddChild")}
                              onClick={() => onAddChild(row)}
                            >
                              <Plus className="size-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("admin.materials.actionAddChild")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
                {showLineBelow && dropLineRow}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
