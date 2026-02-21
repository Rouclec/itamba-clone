"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/use-locale";
import { useT } from "@/app/i18n/client";
import { X } from "lucide-react";
import Image from "next/image";

export default function PaymentErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = useLocalePath();
  const { t } = useT("translation");

  const errorDetail = searchParams.get("message");
  let decodedMessage: string | null = null;
  if (errorDetail != null) {
    try {
      decodedMessage = decodeURIComponent(errorDetail);
    } catch {
      decodedMessage = errorDetail;
    }
  }

  const handleRetry = () => {
    router.back();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/assets/payment-failed.png"
          alt="Success"
          width={100}
          height={100}
        />
        <div className="text-center">
          <h1 className="text-destructive text-xl font-bold">
            {t("payment.failedTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("payment.failedMessage")}
          </p>
          {decodedMessage && (
            <p className="text-muted-foreground mt-2 text-sm italic">
              {decodedMessage}
            </p>
          )}
        </div>
        <Button className="w-full max-w-xs py-3" onClick={handleRetry}>
          {t("payment.retry")}
        </Button>
      </div>
    </div>
  );
}
