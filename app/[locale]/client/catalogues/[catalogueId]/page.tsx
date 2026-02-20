"use client";

import { useParams } from "next/navigation";
import { CatalogueDocumentsPageContent } from "@/components/client-library/catalogue-documents-page-content";

export default function CatalogueDocumentsPage() {
  const params = useParams();
  const catalogueId = params?.catalogueId as string | undefined;

  if (!catalogueId) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-6">
      <CatalogueDocumentsPageContent catalogueId={catalogueId} />
    </div>
  );
}
