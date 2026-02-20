"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useBookmarks } from "@/contexts/bookmarks-context";
import { useNotes } from "@/contexts/notes-context";
import { useAuth } from "@/lib/auth-context";
import { useRestrictions } from "@/hooks/use-restrictions";
import {
  RestrictionModal,
  getRestrictionCopy,
} from "@/components/restriction-modal";
import { useT } from "@/app/i18n/client";
import { RichTextViewer } from "@/components/client-library/rich-text-viewer";
import {
  MdBookmark,
  MdBookmarkBorder,
  MdOutlineNoteAdd,
  MdOutlineEdit,
} from "react-icons/md";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteEditor } from "@/components/client-library/note-editor";
import { HiOutlineTrash } from "react-icons/hi2";

export interface ArticleDetailModalArticle {
  id?: string;
  ref: string;
  json_body?: string;
  body?: string;
}

export interface ArticleDetailModalDocument {
  id?: string;
  ref: string;
  title: string;
}

export interface ArticleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleDetailModalArticle | null;
  document: ArticleDetailModalDocument | null;
}

function formatNoteDate(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ArticleDetailModal({
  open,
  onOpenChange,
  article,
  document: doc,
}: ArticleDetailModalProps) {
  const { t } = useT("translation");
  const { userId, user, currentUser } = useAuth();
  const role = currentUser?.userRole ?? user?.role;
  const { bookmarksExceeded, bookmarksLimit, notesExceeded, notesLimit } =
    useRestrictions(role, userId ?? undefined);
  const [showBookmarkRestriction, setShowBookmarkRestriction] = useState(false);
  const [showNotesRestriction, setShowNotesRestriction] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const notesSectionRef = useRef<HTMLDivElement>(null);

  const { displayBookmarkedIds, bookmarkPendingMaterialId, toggleBookmark } =
    useBookmarks();
  const {
    notesForMaterial,
    createNote,
    updateNote,
    noteCreatePendingMaterialId,
    noteUpdatePendingId,
    noteDeletePendingId,
    deleteNote,
  } = useNotes();

  const materialId = article?.id ?? "";
  const materialRef = article?.ref ?? "";
  const isBookmarked = materialId
    ? displayBookmarkedIds.has(materialId)
    : false;
  const bookmarkPending = materialId
    ? bookmarkPendingMaterialId === materialId
    : false;
  const notes = materialId ? notesForMaterial(materialId) : [];
  const addNotePending = materialId
    ? noteCreatePendingMaterialId === materialId
    : false;

  const bookmarkRestrictionCopy = useMemo(
    () =>
      getRestrictionCopy(
        "bookmarks-limit",
        t,
        bookmarksLimit < 0 ? undefined : bookmarksLimit,
      ),
    [t, bookmarksLimit],
  );
  const notesRestrictionCopy = useMemo(
    () =>
      getRestrictionCopy(
        "notes-limit",
        t,
        notesLimit < 0 ? undefined : notesLimit,
      ),
    [t, notesLimit],
  );

  const handleBookmarkClick = useCallback(() => {
    if (!materialId || !materialRef) return;
    toggleBookmark({
      materialId,
      materialRef,
      bookmarksExceeded,
      onLimitReached: () => setShowBookmarkRestriction(true),
    });
  }, [materialId, materialRef, bookmarksExceeded, toggleBookmark]);

  /** Open the rich text note editor (scroll to notes section + show editor). */
  const handleNotesClick = useCallback(() => {
    setNoteEditorOpen(true);
  }, []);

  /** When note editor opens (new or edit), scroll the notes section into view. */
  useEffect(() => {
    if ((!noteEditorOpen && !editingNoteId) || !notesSectionRef.current)
      return;
    const id = setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    return () => clearTimeout(id);
  }, [noteEditorOpen, editingNoteId]);

  /** Save from note editor: create note with title + ProseMirror JSON, then close editor. */
  const handleSaveNote = useCallback(
    (noteTitle: string, jsonMsg: string) => {
      if (!materialId || !materialRef || !userId || !doc) return;
      if (notesExceeded) {
        setShowNotesRestriction(true);
        return;
      }
      createNote({
        materialId,
        materialRef,
        documentId: doc.id,
        documentRef: doc.ref,
        documentTitle: doc.title,
        noteTitle,
        msg: "",
        jsonMsg,
        notesExceeded,
        onLimitReached: () => setShowNotesRestriction(true),
      });
      setNoteEditorOpen(false);
      setEditingNoteId(null);
    },
    [materialId, materialRef, userId, doc, notesExceeded, createNote],
  );

  const handleUpdateNote = useCallback(
    (noteId: string, noteTitle: string, jsonMsg: string) => {
      if (!userId) return;
      updateNote({ noteId, noteTitle, msg: undefined, jsonMsg });
      setEditingNoteId(null);
    },
    [userId, updateNote],
  );

  const hasJsonBody =
    article?.json_body?.trim() && article.json_body?.trim() !== "{}";
  const hasBody = article?.body?.trim();

  if (!article) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          style={{ width: "90vw", maxWidth: 1104 }}
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-lg border p-0"
        >
          <DialogTitle className="sr-only">{article.ref}</DialogTitle>
          <DialogDescription className="sr-only">
            Article content and notes
          </DialogDescription>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header: title + 3 actions (bookmark, notes, close) */}
            <div className="flex shrink-0 items-center justify-between gap-4 p-6">
              <h2 className="text-primary text-xl font-semibold leading-tight truncate min-w-0">
                {article.ref}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                {materialId && (
                  <button
                    type="button"
                    aria-label={
                      isBookmarked ? "Remove bookmark" : "Add bookmark"
                    }
                    className={cn(
                      "size-8 rounded-md flex items-center justify-center bg-hover hover:bg-hover-light text-body-text",
                      bookmarkPending && "cursor-wait pointer-events-none",
                    )}
                    onClick={handleBookmarkClick}
                  >
                    {bookmarkPending ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : isBookmarked ? (
                      <MdBookmark className="size-4" />
                    ) : (
                      <MdBookmarkBorder className="size-4" />
                    )}
                  </button>
                )}
                {materialId && (
                  <button
                    type="button"
                    aria-label={t("client.addNote")}
                    disabled={
                      addNotePending ||
                      noteEditorOpen ||
                      !!editingNoteId
                    }
                    className={cn(
                      "size-8 rounded-md flex items-center justify-center bg-hover hover:bg-hover-light text-body-text",
                      addNotePending && "cursor-wait pointer-events-none",
                      (noteEditorOpen || editingNoteId) && "opacity-70",
                    )}
                    onClick={handleNotesClick}
                  >
                    {addNotePending ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                      <MdOutlineNoteAdd className="size-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t("common.close")}
                  className="size-8 rounded-md flex items-center justify-center bg-hover hover:bg-hover-light text-body-text"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Article content - scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-6">
                {hasJsonBody ? (
                  <div className="text-body-text font-merriweather text-lg font-light [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                    <RichTextViewer content={article.json_body!} />
                  </div>
                ) : hasBody ? (
                  <div
                    className="text-body-text font-merriweather text-lg font-light [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
                    dangerouslySetInnerHTML={{ __html: article.body! }}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("client.noContent")}
                  </p>
                )}
              </div>

              {/* My Notes section */}
              {materialId && (
                <div ref={notesSectionRef} className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-4 pb-5 border-b border-[#B1C2DB]">
                    <h3 className="text-body-text font-semibold text-base">
                      {t("client.myNotes")} ({notes.length})
                    </h3>
                    {!noteEditorOpen && (
                      <button
                        type="button"
                        aria-label={t("client.addNote")}
                        disabled={addNotePending}
                        className={cn(
                          "flex items-center justify-center size-8 rounded-md bg-hover hover:bg-hover-light text-body-text",
                          addNotePending && "cursor-wait pointer-events-none",
                        )}
                        onClick={handleNotesClick}
                      >
                        {addNotePending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MdOutlineNoteAdd className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {(noteEditorOpen || editingNoteId) ? (
                    <div className="mb-4">
                      {editingNoteId ? (
                        (() => {
                          const note = notes.find(
                            (n) => n.noteId === editingNoteId,
                          );
                          if (!note?.noteId) return null;
                          return (
                            <NoteEditor
                              key={editingNoteId}
                              defaultTitle={note.noteTitle ?? ""}
                              initialJson={note.jsonMsg}
                              onSave={(title, json) =>
                                handleUpdateNote(note.noteId!, title, json)
                              }
                              onCancel={() => setEditingNoteId(null)}
                              ariaLabel={t("client.addNote")}
                            />
                          );
                        })()
                      ) : (
                        <NoteEditor
                          defaultTitle=""
                          onSave={handleSaveNote}
                          onCancel={() => setNoteEditorOpen(false)}
                          ariaLabel={t("client.addNote")}
                        />
                      )}
                    </div>
                  ) : null}
                  <ul className="flex flex-col gap-2">
                    {notes.map((note, i) => {
                      const hasJsonBody =
                        note.jsonMsg?.trim() && note.jsonMsg?.trim() !== "{}";
                      const hasBody = note.msg?.trim();
                      return (
                        <li
                          key={note.noteId}
                          className={`${i === notes.length - 1 ? "border-0" : "border-b"} pb-4 border-border`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-bold text-body-text line-clamp-2">
                                {note.noteTitle || t("client.untitledNote")}
                              </p>
                              <div className="text-body-text text-sm mt-1 font-merriweather [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                                {hasJsonBody ? (
                                  <RichTextViewer content={note.jsonMsg!} />
                                ) : hasBody ? (
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: note.msg!,
                                    }}
                                  />
                                ) : (
                                  <span>—</span>
                                )}
                              </div>
                              <p className="text-muted-foreground text-xs mt-2">
                                {formatNoteDate(
                                  note.updatedAt || note.createdAt,
                                )}
                              </p>
                            </div>
                            {note.noteId &&
                              !note.noteId.startsWith("pending-") && (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    aria-label="Edit note"
                                    disabled={
                                      noteUpdatePendingId === note.noteId
                                    }
                                    className="p-1 text-body-text hover:text-primary disabled:opacity-50"
                                    onClick={() => {
                                      setEditingNoteId(note.noteId!);
                                      setNoteEditorOpen(false);
                                    }}
                                  >
                                    <MdOutlineEdit className="size-5" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={t("common.delete")}
                                    disabled={
                                      noteDeletePendingId === note.noteId
                                    }
                                    className="p-1 text-destructive hover:text-destructive/90 disabled:opacity-50"
                                    onClick={() =>
                                      setNoteToDeleteId(note.noteId!)
                                    }
                                  >
                                    {noteDeletePendingId === note.noteId ? (
                                      <Loader2 className="size-5 animate-spin" />
                                    ) : (
                                      <HiOutlineTrash className="size-5" />
                                    )}
                                  </button>
                                </div>
                              )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RestrictionModal
        open={showBookmarkRestriction}
        onOpenChange={setShowBookmarkRestriction}
        variant="bookmarks-limit"
        limit={bookmarksLimit < 0 ? undefined : bookmarksLimit}
        titleLine1={bookmarkRestrictionCopy.titleLine1}
        titleLine2={bookmarkRestrictionCopy.titleLine2}
        body={bookmarkRestrictionCopy.body}
        ctaText={bookmarkRestrictionCopy.ctaText}
        imageOverlay={bookmarkRestrictionCopy.imageOverlay}
      />
      <RestrictionModal
        open={showNotesRestriction}
        onOpenChange={setShowNotesRestriction}
        variant="notes-limit"
        limit={notesLimit < 0 ? undefined : notesLimit}
        titleLine1={notesRestrictionCopy.titleLine1}
        titleLine2={notesRestrictionCopy.titleLine2}
        body={notesRestrictionCopy.body}
        ctaText={notesRestrictionCopy.ctaText}
        imageOverlay={notesRestrictionCopy.imageOverlay}
      />

      <AlertDialog
        open={!!noteToDeleteId}
        onOpenChange={(open) => !open && setNoteToDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("client.deleteNoteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.close")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (noteToDeleteId) {
                  deleteNote({ noteId: noteToDeleteId });
                  setNoteToDeleteId(null);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
