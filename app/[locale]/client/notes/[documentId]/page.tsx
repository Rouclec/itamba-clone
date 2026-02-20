"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { DocumentDetailView } from "../../[documentId]/page";

export default function NoteDocumentDetailPage() {
  const params = useParams();
  const documentId = params?.documentId as string | undefined;
  const path = useLocalePath();
  const { t } = useT("translation");

  const backLink = useMemo(
    () => ({
      href: path("/client/notes"),
      label: t("librarySidebar.notes"),
    }),
    [path, t],
  );

  if (!documentId) {
    return null;
  }

  return (
    <DocumentDetailView documentId={documentId} backLink={backLink} />
  );
}
