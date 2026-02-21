"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Underline as UnderlineIcon,
  Strikethrough,
  Undo2,
  Redo2,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/app/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

/** Reusable active button style so selection/format is visible */
const btn = "rounded p-1.5 text-body-text hover:bg-hover transition-colors";
const btnActive = "bg-primary/20 text-primary ring-1 ring-inset ring-primary/40";

export interface NoteEditorProps {
  defaultTitle?: string;
  /** When editing an existing note, pass its JSON body so the editor starts with that content. */
  initialJson?: string;
  onSave: (noteTitle: string, jsonMsg: string) => void;
  onCancel: () => void;
  ariaLabel?: string;
}

const tooltipContentClass =
  "bg-surface text-foreground font-medium border border-border shadow-md";
const tooltipArrowClass = "bg-surface fill-surface";

function Toolbar({
  editor,
  linkDialogOpenRef,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  linkDialogOpenRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { t } = useT("translation");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const linkFromRef = useRef<number>(0);
  const linkToRef = useRef<number>(0);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").run();
    }
    const { from, to } = editor.state.selection;
    const previousUrl = editor.getAttributes("link").href ?? "";
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    linkFromRef.current = from;
    linkToRef.current = to;
    setLinkUrl(previousUrl || "https://");
    setLinkText(selectedText);
    setLinkOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    const text = linkText.trim();
    const from = linkFromRef.current;
    const to = linkToRef.current;
    setLinkOpen(false);
    editor.chain().focus();
    if (!url) {
      editor.extendMarkRange("link").unsetLink().run();
      return;
    }
    if (text) {
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from, to },
          {
            type: "text",
            text,
            marks: [{ type: "link", attrs: { href: url } }],
          }
        )
        .run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor, linkUrl, linkText]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }, [editor]);

  useEffect(() => {
    linkDialogOpenRef.current = openLinkDialog;
    return () => {
      linkDialogOpenRef.current = null;
    };
  }, [linkDialogOpenRef, openLinkDialog]);

  if (!editor) return null;

  return (
    <>
      <TooltipProvider delayDuration={2000}>
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted-fill/50 p-2">
          {/* Undo / Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className={cn(btn, "disabled:opacity-40")}
                aria-label="Undo"
              >
                <Undo2 className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipUndo")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className={cn(btn, "disabled:opacity-40")}
                aria-label="Redo"
              >
                <Redo2 className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipRedo")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Text formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(btn, editor.isActive("bold") && btnActive)}
                aria-label="Bold"
              >
                <Bold className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipBold")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(btn, editor.isActive("italic") && btnActive)}
                aria-label="Italic"
              >
                <Italic className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipItalic")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(btn, editor.isActive("underline") && btnActive)}
                aria-label="Underline"
              >
                <UnderlineIcon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipUnderline")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(btn, editor.isActive("strike") && btnActive)}
                aria-label="Strikethrough"
              >
                <Strikethrough className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipStrikethrough")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(btn, editor.isActive("code") && btnActive)}
                aria-label="Code"
              >
                <Code className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipCode")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Headings H1–H5 */}
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <Tooltip key={level}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level }).run()
                  }
                  className={cn(
                    btn,
                    editor.isActive("heading", { level }) && btnActive,
                    "min-w-[28px] font-semibold"
                  )}
                  aria-label={`Heading ${level}`}
                >
                  {level === 1 && <Heading1 className="size-4" />}
                  {level === 2 && <Heading2 className="size-4" />}
                  {level === 3 && <Heading3 className="size-4" />}
                  {level === 4 && <span className="text-xs">H4</span>}
                  {level === 5 && <span className="text-xs">H5</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                {t("editor.tooltipHeading", { level })}
              </TooltipContent>
            </Tooltip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Quote */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(btn, editor.isActive("blockquote") && btnActive)}
                aria-label="Quote"
              >
                <Quote className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipQuote")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(btn, editor.isActive("bulletList") && btnActive)}
                aria-label="Bullet list"
              >
                <List className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipBulletList")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(btn, editor.isActive("orderedList") && btnActive)}
                aria-label="Numbered list"
              >
                <ListOrdered className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipNumberedList")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openLinkDialog}
                className={cn(btn, editor.isActive("link") && btnActive)}
                aria-label="Insert or edit link"
              >
                <Link className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipLink")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={cn(btn, editor.isActive({ textAlign: "left" }) && btnActive)}
                aria-label="Align left"
              >
                <AlignLeft className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipAlignLeft")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={cn(
                  btn,
                  editor.isActive({ textAlign: "center" }) && btnActive
                )}
                aria-label="Align center"
              >
                <AlignCenter className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipAlignCenter")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={cn(
                  btn,
                  editor.isActive({ textAlign: "right" }) && btnActive
                )}
                aria-label="Align right"
              >
                <AlignRight className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipAlignRight")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                className={cn(
                  btn,
                  editor.isActive({ textAlign: "justify" }) && btnActive
                )}
                aria-label="Justify"
              >
                <AlignJustify className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipJustify")}
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {/* Table */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
                className={btn}
                aria-label="Insert table"
              >
                <Table className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipInsertTable")}
            </TooltipContent>
          </Tooltip>
          {editor.isActive("table") && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className={btn}
                    aria-label="Add row before"
                  >
                    <Rows3 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipAddRowBefore")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className={btn}
                    aria-label="Add row after"
                  >
                    <Rows3 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipAddRowAfter")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className={btn}
                    aria-label="Add column before"
                  >
                    <Columns3 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipAddColumnBefore")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className={btn}
                    aria-label="Add column after"
                  >
                    <Columns3 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipAddColumnAfter")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className={cn(btn, "text-destructive hover:bg-destructive/10")}
                    aria-label="Delete row"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipDeleteRow")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className={cn(btn, "text-destructive hover:bg-destructive/10")}
                    aria-label="Delete column"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipDeleteColumn")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className={cn(btn, "text-destructive hover:bg-destructive/10")}
                    aria-label="Delete table"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipDeleteTable")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                    className={cn(
                      btn,
                      editor.isActive("tableHeader") && btnActive
                    )}
                    aria-label="Toggle header row"
                  >
                    <span className="text-xs font-medium">H</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
                  {t("editor.tooltipHeaderRow")}
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className={btn}
                aria-label="Horizontal rule"
              >
                <Minus className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={tooltipContentClass} arrowClassName={tooltipArrowClass}>
              {t("editor.tooltipHorizontalRule")}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={true}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="link-url">Link URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink();
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-text" className="text-muted-foreground font-normal">
                Display text (optional)
              </Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Leave empty to use selected text or URL"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink();
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={removeLink}
              >
                Remove link
              </Button>
            )}
            <div className="flex flex-1 justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyLink}>
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseInitialContent(json: string | undefined): object {
  if (!json?.trim() || json.trim() === "{}") return EMPTY_DOC;
  try {
    const parsed = JSON.parse(json) as object;
    if (parsed && typeof parsed === "object" && "type" in parsed) return parsed;
  } catch {
    // ignore
  }
  return EMPTY_DOC;
}

export function NoteEditor({
  defaultTitle = "",
  initialJson,
  onSave,
  onCancel,
  ariaLabel = "Note content",
}: NoteEditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);
  const linkDialogOpenRef = useRef<(() => void) | null>(null);
  const initialContent = useMemo(
    () => parseInitialContent(initialJson),
    [initialJson],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      LinkExtension.configure({ openOnClick: false }),
      TableKit,
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
    ],
    content: initialContent,
    editable: true,
    editorProps: {
      attributes: {
        class:
          "text-body-text text-sm font-merriweather min-h-[120px] px-3 py-2 focus:outline-none max-w-none " +
          "[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through " +
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:first:mt-0 " +
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 " +
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:first:mt-0 " +
          "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1.5 [&_h4]:first:mt-0 " +
          "[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1 [&_h5]:first:mt-0 " +
          "[&_code]:bg-muted-fill [&_code]:px-1.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono " +
          "[&_pre]:bg-muted-fill [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
          "[&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground " +
          "[&_a]:underline [&_a]:text-[var(--tertiary)] [&_a]:cursor-pointer [&_a]:hover:text-[var(--tertiary)]/90 " +
          "[&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted-fill/50 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
      },
      handleClick(view, _pos, event) {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest("a")
        ) {
          event.preventDefault();
          linkDialogOpenRef.current?.();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", onUpdate);
    editor.on("transaction", onUpdate);
    return () => {
      editor.off("selectionUpdate", onUpdate);
      editor.off("transaction", onUpdate);
    };
  }, [editor]);

  // Sync link title (href) so hovering shows the URL
  useEffect(() => {
    if (!editor?.view?.dom) return;
    const syncLinkTitles = () => {
      editor.view.dom.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href) a.setAttribute("title", href);
      });
    };
    syncLinkTitles();
    editor.on("transaction", syncLinkTitles);
    return () => editor.off("transaction", syncLinkTitles);
  }, [editor]);

  useEffect(() => {
    if (titleRef.current && defaultTitle) {
      titleRef.current.value = defaultTitle;
    }
  }, [defaultTitle]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const title =
      (titleRef.current?.value?.trim()) || defaultTitle || "New note";
    const json = editor.getJSON();
    const jsonMsg =
      json && typeof json === "object" ? JSON.stringify(json) : "{}";
    onSave(title, jsonMsg);
  }, [editor, defaultTitle, onSave]);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex shrink-0 items-center justify-end border-b border-border bg-muted-fill/50 px-2 py-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="size-8 rounded-md flex items-center justify-center bg-hover hover:bg-hover-light text-body-text"
          aria-label="Close editor"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-1.5">
        <input
          ref={titleRef}
          type="text"
          placeholder="Note title"
          className="w-full border-0 bg-transparent px-0 py-0 text-base font-bold text-body-text placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          aria-label="Note title"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {editor && <Toolbar editor={editor} linkDialogOpenRef={linkDialogOpenRef} />}
        <div className="min-h-0 flex-1">
          <EditorContent editor={editor} aria-label={ariaLabel} />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted-fill/30 px-3 py-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-body-text hover:bg-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!editor}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Save
        </button>
      </div>
    </div>
  );
}

const editorContentClass =
  "text-body-text text-sm font-merriweather min-h-[120px] px-3 py-2 focus:outline-none max-w-none " +
  "[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through " +
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:first:mt-0 " +
  "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:first:mt-0 " +
  "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1.5 [&_h4]:first:mt-0 " +
  "[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1 [&_h5]:first:mt-0 " +
  "[&_code]:bg-muted-fill [&_code]:px-1.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono " +
  "[&_pre]:bg-muted-fill [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground " +
  "[&_a]:underline [&_a]:text-[var(--tertiary)] [&_a]:cursor-pointer [&_a]:hover:text-[var(--tertiary)]/90 " +
  "[&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted-fill/50 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1";

export interface RichTextEditorBlockProps {
  value?: string;
  onChange?: (json: string) => void;
  label: string;
  required?: boolean;
  "aria-label"?: string;
}

/** Full rich text editor (same as notes: toolbar + content). Use for header/footer etc. */
export function RichTextEditorBlock({
  value,
  onChange,
  label,
  required,
  "aria-label": ariaLabel = "Rich text content",
}: RichTextEditorBlockProps) {
  const linkDialogOpenRef = useRef<(() => void) | null>(null);
  const initialContent = useMemo(() => parseInitialContent(value), [value]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      LinkExtension.configure({ openOnClick: false }),
      TableKit,
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
    ],
    content: initialContent,
    editable: true,
    editorProps: {
      attributes: { class: editorContentClass },
      handleClick(view, _pos, event) {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest("a")
        ) {
          event.preventDefault();
          linkDialogOpenRef.current?.();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor || !onChange) return;
    const onUpdate = () => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json ?? EMPTY_DOC));
    };
    editor.on("transaction", onUpdate);
    return () => editor.off("transaction", onUpdate);
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor?.view?.dom) return;
    const syncLinkTitles = () => {
      editor.view.dom.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href) a.setAttribute("title", href);
      });
    };
    syncLinkTitles();
    editor.on("transaction", syncLinkTitles);
    return () => editor.off("transaction", syncLinkTitles);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="rounded-md border border-border bg-background overflow-hidden">
        <Toolbar editor={editor} linkDialogOpenRef={linkDialogOpenRef} />
        <EditorContent editor={editor} aria-label={ariaLabel} />
      </div>
    </div>
  );
}
