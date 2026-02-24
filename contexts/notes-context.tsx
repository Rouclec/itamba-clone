"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { v2UserNote } from "@/@hey_api/annotation.swagger/types.gen";
import {
  annotationServiceListsUsersNotesOptions,
  annotationServiceListsUsersNotesQueryKey,
  annotationServiceCreateUserNoteMutation,
  annotationServiceUpdateUserNoteMutation,
  annotationServiceDeleteNoteMutation,
} from "@/@hey_api/annotation.swagger/@tanstack/react-query.gen";
import { useAuth } from "@/lib/auth-context";

export interface CreateNoteParams {
  materialId: string;
  materialRef: string;
  documentId?: string;
  documentRef?: string;
  documentTitle?: string;
  noteTitle?: string;
  msg?: string;
  jsonMsg?: string;
  notesExceeded: boolean;
  onLimitReached: () => void;
}

export interface UpdateNoteParams {
  noteId: string;
  noteTitle?: string;
  msg?: string;
  jsonMsg?: string;
}

export interface DeleteNoteParams {
  noteId: string;
}

interface NotesContextValue {
  /** All notes (optimistic + server). Use notesForMaterial(materialId) for one article. */
  displayNotes: v2UserNote[];
  /** Material ID for which create is in progress (show loader on add button). */
  noteCreatePendingMaterialId: string | null;
  /** Note ID for which update is in progress. */
  noteUpdatePendingId: string | null;
  /** Note ID for which delete is in progress. */
  noteDeletePendingId: string | null;
  /** Call when any screen fetches notes; keeps context in sync. */
  syncFromServer: (notes: v2UserNote[] | undefined) => void;
  /** Create a note. Optimistic add + API; invalidates list on success. */
  createNote: (params: CreateNoteParams) => void;
  /** Update a note. Optimistic update + API; invalidates list on success. */
  updateNote: (params: UpdateNoteParams) => void;
  /** Delete a note. Optimistic remove + API; invalidates list on success. */
  deleteNote: (params: DeleteNoteParams) => void;
  /** Notes for a given material (from displayNotes). */
  notesForMaterial: (materialId: string) => v2UserNote[];
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [displayNotes, setDisplayNotes] = useState<v2UserNote[]>([]);
  const [noteCreatePendingMaterialId, setNoteCreatePendingMaterialId] =
    useState<string | null>(null);
  const [noteUpdatePendingId, setNoteUpdatePendingId] = useState<string | null>(
    null,
  );
  const [noteDeletePendingId, setNoteDeletePendingId] = useState<string | null>(
    null,
  );

  /** Invalidate all user notes list queries (including useRestrictions' count query). */
  const invalidateAllNotesQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return (
          typeof key === "object" &&
          key !== null &&
          (key as { _id?: string })._id === "annotationServiceListsUsersNotes"
        );
      },
    });
  }, [queryClient]);

  const createNoteMutation = useMutation({
    ...annotationServiceCreateUserNoteMutation(),
    onSuccess: () => {
      invalidateAllNotesQueries();
    },
    onError: () => {
      setDisplayNotes((prev) =>
        prev.filter((n) => !n.noteId?.startsWith("pending-")),
      );
    },
    onSettled: () => setNoteCreatePendingMaterialId(null),
  });

  const updateNoteMutation = useMutation({
    ...annotationServiceUpdateUserNoteMutation(),
    onSuccess: () => invalidateAllNotesQueries(),
    onError: () => invalidateAllNotesQueries(),
    onSettled: () => setNoteUpdatePendingId(null),
  });

  const deleteNoteMutation = useMutation({
    ...annotationServiceDeleteNoteMutation(),
    onSuccess: () => invalidateAllNotesQueries(),
    onError: () => invalidateAllNotesQueries(),
    onSettled: () => setNoteDeletePendingId(null),
  });

  const syncFromServer = useCallback((notes: v2UserNote[] | undefined) => {
    setDisplayNotes(notes ?? []);
  }, []);

  const notesForMaterial = useCallback(
    (materialId: string) =>
      displayNotes.filter((n) => n.materialId === materialId),
    [displayNotes],
  );

  const createNote = useCallback(
    (params: CreateNoteParams) => {
      const {
        materialId,
        materialRef,
        documentId,
        documentRef,
        documentTitle,
        noteTitle,
        msg,
        jsonMsg,
        notesExceeded,
        onLimitReached,
      } = params;
      if (!userId) return;
      if (notesExceeded) {
        onLimitReached();
        return;
      }
      const optimisticNote: v2UserNote = {
        materialId,
        materialRef,
        documentId,
        documentRef,
        documentTitle,
        noteTitle,
        msg,
        jsonMsg,
        noteId: `pending-${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDisplayNotes((prev) => [...prev, optimisticNote]);
      setNoteCreatePendingMaterialId(null);
      createNoteMutation.mutate({
        body: {
          note: {
            materialId,
            materialRef,
            documentId,
            documentRef,
            documentTitle,
            noteTitle,
            msg,
            jsonMsg,
          },
        },
        path: { "note.userId": userId },
      });
    },
    [userId, createNoteMutation],
  );

  const updateNote = useCallback(
    (params: UpdateNoteParams) => {
      const { noteId, noteTitle, msg, jsonMsg } = params;
      if (!userId) return;
      setDisplayNotes((prev) =>
        prev.map((n) =>
          n.noteId === noteId
            ? { ...n, noteTitle, msg, jsonMsg, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
      setNoteUpdatePendingId(noteId);
      updateNoteMutation.mutate({
        body: {
          note: { noteId, noteTitle, msg, jsonMsg },
        },
        path: { "note.userId": userId },
      });
    },
    [userId, updateNoteMutation],
  );

  const deleteNote = useCallback(
    (params: DeleteNoteParams) => {
      const { noteId } = params;
      if (!userId) return;
      setDisplayNotes((prev) => prev.filter((n) => n.noteId !== noteId));
      setNoteDeletePendingId(noteId);
      deleteNoteMutation.mutate({
        path: { userId, noteId },
      });
    },
    [userId, deleteNoteMutation],
  );

  const value = useMemo<NotesContextValue>(
    () => ({
      displayNotes,
      noteCreatePendingMaterialId,
      noteUpdatePendingId,
      noteDeletePendingId,
      syncFromServer,
      createNote,
      updateNote,
      deleteNote,
      notesForMaterial,
    }),
    [
      displayNotes,
      noteCreatePendingMaterialId,
      noteUpdatePendingId,
      noteDeletePendingId,
      syncFromServer,
      createNote,
      updateNote,
      deleteNote,
      notesForMaterial,
    ],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx)
    throw new Error("useNotes must be used within a NotesProvider");
  return ctx;
}

/** Fetches the user's notes list and syncs it to the notes context. Use on any screen that shows notes. */
export function useNotesQuery() {
  const { userId } = useAuth();
  const { syncFromServer } = useNotes();
  const query = useQuery({
    ...annotationServiceListsUsersNotesOptions({
      path: { userId: userId ?? "" },
      query: { page: "1", pageSize: "100000" },
    }),
    enabled: !!userId,
    staleTime: 45 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 90 * 1000,
  });
  useEffect(() => {
    if (query.data?.notes) syncFromServer(query.data.notes);
  }, [query.data?.notes, syncFromServer]);
  return query;
}
