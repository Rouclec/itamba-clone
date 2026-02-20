"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { DocumentDetailView } from "../../../[documentId]/page";

export default function CatalogueDocumentDetailPage() {
  const params = useParams();
  const catalogueId = params?.catalogueId as string | undefined;
  const documentId = params?.documentId as string | undefined;
  const path = useLocalePath();
  const { t } = useT("translation");

  const backLink = useMemo(() => {
    if (!catalogueId) return undefined;
    return {
      href: path(`/client/catalogues/${catalogueId}`),
      label: t("client.catalogue"),
    };
  }, [catalogueId, path, t]);

  if (!documentId) {
    return null;
  }

  return (
    <DocumentDetailView
      documentId={documentId}
      backLink={backLink}
    />
  );
}
